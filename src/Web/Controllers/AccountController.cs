using System.Configuration;
using System.Web.Mvc;
using System.Web.Security;
using Newtonsoft.Json;
using Web.Helpers;
using Web.Models;

namespace Web.Controllers
{
    public class AccountController : Controller
    {
        public ActionResult Login(string returnUrl)
        {
            ViewBag.ReturnUrl = returnUrl;

            var clientLocation = ConfigurationManager.AppSettings["AmazonClientIdLocation"];
            var clientContent = System.IO.File.ReadAllText(clientLocation);
            var model = JsonConvert.DeserializeObject<LoginModel>(clientContent);

            model.AppName = ConfigurationManager.AppSettings["AppName"];
            model.MockMode = ConfigurationManager.AppSettings["MockMode"];

            return View(model);
        }

        [HttpPost]
        [AllowAnonymous]
        public ActionResult Login(LoginPostModel model, string returnUrl)
        {
            var webApiHelper = new WebApiHelper();
            var result = webApiHelper.CallWebApi<LoginWithAmazonResponse>("https://api.amazon.com",
                "user/profile?access_token=" + model.AccessToken, null);

            FormsAuthentication.SetAuthCookie(result.user_id, false);

            Session[SessionInfo.Name] = result.name;
            Session[SessionInfo.Email] = result.email;
            Session[SessionInfo.AccessToken] = model.AccessToken;

            return RedirectToLocal(returnUrl);
        }

        private ActionResult RedirectToLocal(string returnUrl)
        {
            if (Url.IsLocalUrl(returnUrl))
                return Redirect(returnUrl);

            return RedirectToAction("Index", "Home");
        }

        public ActionResult LogOff()
        {
            FormsAuthentication.SignOut();
            return Redirect("~/");
        }
    }
}