import { MongoClient } from 'mongodb';
import {
	INodeType,
	INodeTypeDescription,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type INodeExecutionData,
	type INodePropertyOptions,
} from 'n8n-workflow';

export class MongoKeyValue implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MongoKeyValue',
		name: 'mongoKeyValue',
		icon: 'file:httpbin.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["action"] + ": " + $parameter["key"]}}',
		description: 'Interact with MongoKeyValue API',
		defaults: {
			name: 'MongoKeyValue',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'mongoKeyValueApi',
				required: true,
			},
		],
		/**
		 * In the properties array we have two mandatory options objects required
		 *
		 * [Resource & Operation]
		 *
		 * https://docs.n8n.io/integrations/creating-nodes/code/create-first-node/#resources-and-operations
		 *
		 * In our example, the operations are separated into their own file (HTTPVerbDescription.ts)
		 * to keep this class easy to read.
		 *
		 */
		properties: [
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get',
						value: 'get',
					},
					{
						name: 'Set',
						value: 'set',
					},
				],
				default: 'get',
			},
			{
				displayName: 'Key Name or ID',
				name: 'key',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
				default: '',
				typeOptions: {
					loadOptionsMethod: 'getKeys',
				},
			},
			{
				displayName: 'New Key Name',
				name: 'newKey',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						action: ['set'],
					},
				},
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'json',
				default: '',
				displayOptions: {
					show: {
						action: ['set'],
					},
				},
			},
			{
				displayName: 'Default Value',
				name: 'defaultValue',
				type: 'json',
				default: '',
				displayOptions: {
					show: {
						action: ['get'],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: {
			async getKeys(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const mongoKeyValueApi = this.getCredentials('mongoKeyValueApi');

				const mongoKeyValueConnectionString = await mongoKeyValueApi;

				const client = new MongoClient(
					mongoKeyValueConnectionString.mongoDbConnectionString as string,
				);

				const database = client.db('n8n-kv');
				const collection = database.collection('kv-store');

				const keys = await collection.find({}, { projection: { _id: 0, key: 1 } }).toArray();

				return [
					{
						name: 'Select a Key or Create a New One Below',
						value: '',
					},
					...keys.map((key) => ({
						name: key.key,
						value: key.key,
					})),
				];
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const mongoKeyValueApi = this.getCredentials('mongoKeyValueApi');

		const mongoKeyValueConnectionString = await mongoKeyValueApi;

		const client = new MongoClient(mongoKeyValueConnectionString.mongoDbConnectionString as string);

		const database = client.db('n8n-kv');
		const collection = database.collection('kv-store');
		const key =
			this.getNodeParameter('key' as unknown as 'resource') ||
			this.getNodeParameter('newKey' as unknown as 'resource');
		if ((this.getNodeParameter('action' as unknown as 'resource') as string) === 'set') {
			const result = this.getNodeParameter('value' as unknown as 'resource');

			await collection.updateOne(
				{ key: key },
				{
					$set: { value: result },
				},
				{ upsert: true },
			);
			items[0].json = {
				result: result,
			};
		} else {
			const result = (await collection.findOne({
				key: key,
			})) as unknown as INodeExecutionData;
			items[0].json = {
				result: result?.value
					? result.value
					: this.getNodeParameter('defaultValue' as unknown as 'resource'),
			};
		}

		return [this.helpers.returnJsonArray(items)];
	}
}
