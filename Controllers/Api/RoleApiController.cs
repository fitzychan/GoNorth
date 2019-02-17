using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GoNorth.Controllers.Api
{
    /// <summary>
    /// Role Api controller
    /// </summary>
    [Authorize(Roles = RoleNames.Administrator)]
    [Route("/api/[controller]/[action]")]
    public class RoleApiController : Controller
    {
        /// <summary>
        /// Returns the available roles
        /// </summary>
        /// <returns>Available Roles</returns>
        [Produces(typeof(List<string>))]
        [HttpGet]
        public IActionResult AvailableRoles()
        {
            return Ok(RoleNames.GetAllRoleNames());
        }
    }
}