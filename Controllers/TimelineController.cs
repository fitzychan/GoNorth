using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GoNorth.Controllers
{
    /// <summary>
    /// Timelien controller
    /// </summary>
    [Authorize]
    [ApiExplorerSettings(IgnoreApi = true)]
    public class TimelineController : Controller
    {
        /// <summary>
        /// Index view
        /// </summary>
        /// <returns>View</returns>
        public IActionResult Index()
        {
            return View();
        }
    }
}