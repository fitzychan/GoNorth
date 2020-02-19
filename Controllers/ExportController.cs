using System;
using System.Linq;
using System.Threading.Tasks;
using GoNorth.Data.Exporting;
using GoNorth.Data.Project;
using GoNorth.Data.User;
using GoNorth.Models.ExportViewModels;
using GoNorth.Services.Export.Dialog;
using GoNorth.Services.Export.Dialog.ActionRendering;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GoNorth.Controllers
{
    /// <summary>
    /// Export controller
    /// </summary>
    [Authorize(Roles = RoleNames.ManageExportTemplates)]
    [ApiExplorerSettings(IgnoreApi = true)]
    public class ExportController : Controller
    {
        /// <summary>
        /// Export Default Template Provider
        /// </summary>
        private readonly IExportDefaultTemplateProvider _exportDefaultTemplateProvider;

        /// <summary>
        /// USer Preferences Db Access
        /// </summary>
        private readonly IUserPreferencesDbAccess _userPreferencesDbAccess;

        /// <summary>
        /// User Manager
        /// </summary>
        private readonly UserManager<GoNorthUser> _userManager;

        /// <summary>
        /// Export Settings
        /// </summary>
        private readonly IExportSettingsDbAccess _exportSettings;

        /// <summary>
        /// Project Db Access
        /// </summary>
        private readonly IProjectDbAccess _projectDbAccess;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="exportDefaultTemplateProvider">Export default template provider</param>
        /// <param name="userPreferencesDbAccess">User PReferences Database access</param>
        /// <param name="userManager">User Manager</param>
        /// <param name="exportSettings">Export settings</param>
        /// <param name="projectDbAccess">Project Db Access</param>
        public ExportController(IExportDefaultTemplateProvider exportDefaultTemplateProvider, IUserPreferencesDbAccess userPreferencesDbAccess, UserManager<GoNorthUser> userManager, IExportSettingsDbAccess exportSettings, IProjectDbAccess projectDbAccess)
        {
            _exportDefaultTemplateProvider = exportDefaultTemplateProvider;
            _userPreferencesDbAccess = userPreferencesDbAccess;
            _userManager = userManager;
            _exportSettings = exportSettings;
            _projectDbAccess = projectDbAccess;
        }

        /// <summary>
        /// Index view
        /// </summary>
        /// <returns>View</returns>
        [HttpGet]
        public IActionResult Index()
        {
            return View();
        }

        /// <summary>
        /// Manage template view
        /// </summary>
        /// <param name="templateType">Template type</param>
        /// <returns>View</returns>
        [HttpGet]
        public async Task<IActionResult> ManageTemplate(TemplateType templateType)
        {
            GoNorthUser currentUser = await _userManager.GetUserAsync(this.User);
            UserPreferences userPreferences = await _userPreferencesDbAccess.GetUserPreferences(currentUser.Id);
            string scriptLanguage = await GetScriptLanguage(_exportDefaultTemplateProvider.IsTemplateTypeLanguage(templateType));

            ManageTemplateViewModel viewModel = new ManageTemplateViewModel();
            if(userPreferences != null)
            {
                viewModel.CodeEditorTheme = userPreferences.CodeEditorTheme;
            }

            if(scriptLanguage != null)
            {
                viewModel.ScriptLanguage = scriptLanguage;
            }

            viewModel.TemplateTypeUrls.Add(BuildExportTemplateTypeUrl(TemplateType.ObjectNpc, "/Kortisto/Npc?id={0}"));
            viewModel.TemplateTypeUrls.Add(BuildExportTemplateTypeUrl(TemplateType.ObjectItem, "/Styr/Item?id={0}"));
            viewModel.TemplateTypeUrls.Add(BuildExportTemplateTypeUrl(TemplateType.ObjectSkill, "/Evne/Skill?id={0}"));

            return View(viewModel);
        }

        /// <summary>
        /// Manage function generation conditions
        /// </summary>
        /// <returns>View</returns>
        public async Task<IActionResult> FunctionGenerationCondition()
        {
            GoNorthProject project = await _projectDbAccess.GetDefaultProject();
            FunctionGenerationConditionViewModel viewModel = new FunctionGenerationConditionViewModel();
            viewModel.DialogFunctionGenerationActionTypes = Enum.GetValues(typeof(ActionType)).Cast<ActionType>().Select(s => new MappedDialogFunctionGenerationActionType {
                Value = (int)s,
                Name = s.ToString()
            }).ToList();
            viewModel.NodeTypes = ExportDialogData.GetAllNodeTypes();
            viewModel.LockId = project.Id;

            return View(viewModel);
        }

        /// <summary>
        /// Returns the selected script language
        /// </summary>
        /// <param name="isLanguage">true if the template is for a language file</param>
        /// <returns>Script Language</returns>
        private async Task<string> GetScriptLanguage(bool isLanguage)
        {
            GoNorthProject project = await _projectDbAccess.GetDefaultProject();
            ExportSettings exportSettings = await _exportSettings.GetExportSettings(project.Id);

            if(exportSettings != null)
            {
                return isLanguage ? exportSettings.LanguageFileLanguage : exportSettings.ScriptLanguage;
            }

            return null;
        }

        /// <summary>
        /// Createsa template type to url mapping
        /// </summary>
        /// <param name="templateType">Template type</param>
        /// <param name="formUrl">Form Url</param>
        /// <returns>Export Template Type Url Mapping</returns>
        private ExportTemplateTypeUrl BuildExportTemplateTypeUrl(TemplateType templateType, string formUrl)
        {
            return new ExportTemplateTypeUrl
            {
                TemplateType = templateType,
                FormUrl = formUrl
            };
        }

    }
}
