using System.Collections.Generic;
using Core;
using DynamoDb;
using NUnit.Framework;

namespace Tests
{
    [TestFixture]
    public class DynamoDbTest
    {
        [Test]
        public void InsertTest()
        {
            var bridge = new Bridge();
            var item = new AlexaWebSite
            {
                Email = "kenneth.choe@gmail.com",
                Name = "Kyoung Sik Choe",
                WebSites = new List<string> { "agilesalt.com", "29r-03.com", "koreanalive.com" }
            };

            bridge.Put(item);

            var item2 = bridge.Get(item.Email);
            Assert.That(item2.Email, Is.EqualTo(item.Email));
            CollectionAssert.AreEquivalent(item2.WebSites, item.WebSites);
        }
    }
}
