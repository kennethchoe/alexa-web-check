using System;
using System.Net.Http;
using System.Net.Http.Headers;
using Newtonsoft.Json;

namespace Web.Helpers
{
    public class WebApiHelper
    {
        public T CallWebApi<T>(string baseAddress, string serviceName, object model)
        {
            var client = new HttpClient {BaseAddress = new Uri(baseAddress)};

            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var call = model == null ? client.GetAsync(serviceName) : client.PostAsJsonAsync(serviceName, model);
            var response = call.Result;

            if (!response.IsSuccessStatusCode)
            {
                var msg = FormatJson(response.Content.ReadAsStringAsync().Result);
                throw new Exception($"Web api call {baseAddress}/{serviceName} failed: {response.ReasonPhrase}\n{msg}");
            }

            return response.Content.ReadAsAsync<T>().Result;
        }

        private string FormatJson(string json)
        {
            dynamic parsedJson = JsonConvert.DeserializeObject(json);
            return JsonConvert.SerializeObject(parsedJson, Formatting.Indented);
        }
    }
}
