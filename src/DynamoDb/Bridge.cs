using Amazon;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Core;

namespace DynamoDb
{
    public class Bridge
    {
        public AmazonDynamoDBClient GetClient()
        {
            var clientConfig = new AmazonDynamoDBConfig
            {
                RegionEndpoint = RegionEndpoint.USEast1
            };

            var client = new AmazonDynamoDBClient(clientConfig);

            return client;
        }

        public void Put(AlexaWebSite item)
        {
            var client = GetClient();
            var context = new DynamoDBContext(client);

            context.Save(item);
        }

        public AlexaWebSite Get(string email)
        {
            var client = GetClient();
            var context = new DynamoDBContext(client);

            var doc = context.Load<AlexaWebSite>(email);

            return doc;
        }
    }
}
