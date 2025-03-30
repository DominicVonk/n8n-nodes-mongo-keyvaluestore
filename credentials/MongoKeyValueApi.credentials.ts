import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class MongoKeyValueApi implements ICredentialType {
	name = 'mongoKeyValueApi';
	displayName = 'MongoDB Key Value API';
	documentationUrl = 'https://docs.mongodb.com/manual/reference/connection-string/';
	properties: INodeProperties[] = [
		{
			displayName: 'MongoDB Connection String',
			name: 'mongoDbConnectionString',
			type: 'string',
			default: '',
			typeOptions: {
				password: false,
			},
		},
	];
}
