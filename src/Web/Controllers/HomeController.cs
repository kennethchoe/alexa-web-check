using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web.Mvc;
using Core;
using DynamoDb;
using Web.Models;

namespace Web.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            if (Session[SessionInfo.Email] == null)
                return RedirectToAction("Login", "Account");

            var model = new HomeIndexModel
            {
                AccessToken = Session[SessionInfo.AccessToken].ToString(),
                AppName = ConfigurationManager.AppSettings["AppName"]
            };
            return View(model);
        }

        [AllowAnonymous]
        public ActionResult Privacy()
        {
            return View();
        }

        public ActionResult GetWebSites()
        {
            var bridge = new Bridge();
            var result = bridge.Get(Session[SessionInfo.Email].ToString());
            var webSites = result?.WebSites.ToArray() ?? new string[] {};
            return Json(webSites, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public void Save(IEnumerable<string> webSites)
        {
            var bridge = new Bridge();
            bridge.Put(new AlexaWebSite
            {
                Email = Session[SessionInfo.Email].ToString(),
                Name = Session[SessionInfo.Name].ToString(),
                WebSites = webSites.ToList()
            });
        }
    }
}