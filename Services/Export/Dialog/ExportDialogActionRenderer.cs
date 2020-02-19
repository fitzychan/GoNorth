using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GoNorth.Data.Exporting;
using GoNorth.Data.FlexFieldDatabase;
using GoNorth.Data.NodeGraph;
using GoNorth.Data.Project;
using GoNorth.Services.Export.Data;
using GoNorth.Services.Export.Dialog.ActionRendering;
using GoNorth.Services.Export.LanguageKeyGeneration;
using GoNorth.Services.Export.Placeholder;
using Microsoft.Extensions.Localization;

namespace GoNorth.Services.Export.Dialog
{
    /// <summary>
    /// Class for Rendering Actions
    /// </summary>
    public class ExportDialogActionRenderer : ExportDialogBaseStepRenderer, IExportDialogStepRenderer
    {
        /// <summary>
        /// Action content
        /// </summary>
        private const string Placeholder_ActionContent = "Tale_Action_Content";


        /// <summary>
        /// Export default template provider
        /// </summary>
        private readonly ICachedExportDefaultTemplateProvider _defaultTemplateProvider;

        /// <summary>
        /// Language Key Generator
        /// </summary>
        private readonly ILanguageKeyGenerator _languageKeyGenerator;

        /// <summary>
        /// String Localizer
        /// </summary>
        private readonly IStringLocalizer _localizer;

        /// <summary>
        /// Export Settings
        /// </summary>
        private ExportSettings _exportSettings;

        /// <summary>
        /// Current Project
        /// </summary>
        private GoNorthProject _project;

        /// <summary>
        /// Action Renderers
        /// </summary>
        private Dictionary<ActionType, IActionRenderer> _actionRenderes;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="errorCollection">Error Collection</param>
        /// <param name="defaultTemplateProvider">Default Template Provider</param>
        /// <param name="cachedDbAccess">Cached Db Access</param>
        /// <param name="dailyRoutineEventPlaceholderResolver">Daily routine event placeholder resolver</param>
        /// <param name="languageKeyGenerator">Language Key Generator</param>
        /// <param name="localizerFactory">Localizer Factory</param>
        /// <param name="exportSettings">Export Settings</param>
        /// <param name="project">Project</param>
        public ExportDialogActionRenderer(ExportPlaceholderErrorCollection errorCollection, ICachedExportDefaultTemplateProvider defaultTemplateProvider, IExportCachedDbAccess cachedDbAccess, IDailyRoutineEventPlaceholderResolver dailyRoutineEventPlaceholderResolver,
                                          ILanguageKeyGenerator languageKeyGenerator, IStringLocalizerFactory localizerFactory, ExportSettings exportSettings, GoNorthProject project) : 
                                          base(errorCollection, localizerFactory)
        {
            _defaultTemplateProvider = defaultTemplateProvider;
            _languageKeyGenerator = languageKeyGenerator;
            _localizer = localizerFactory.Create(typeof(ExportDialogActionRenderer));
            _exportSettings = exportSettings;
            _project = project;

            _actionRenderes = new Dictionary<ActionType, IActionRenderer>();
            _actionRenderes.Add(ActionType.ChangePlayerValue, new NpcValueChangeRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true));
            _actionRenderes.Add(ActionType.ChangeNpcValue, new NpcValueChangeRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false));
            _actionRenderes.Add(ActionType.SpawnItemInPlayerInventory, new InventoryActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true, false, false));
            _actionRenderes.Add(ActionType.TransferItemToPlayerInventory, new InventoryActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true, true, false));
            _actionRenderes.Add(ActionType.RemoveItemFromPlayerInventory, new InventoryActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true, false, true));
            _actionRenderes.Add(ActionType.SpawnItemInNpcInventory, new InventoryActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false, false, false));
            _actionRenderes.Add(ActionType.TransferItemToNpcInventory, new InventoryActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false, true, false));
            _actionRenderes.Add(ActionType.RemoveItemFromNpcInventory, new InventoryActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false, false, true));
            _actionRenderes.Add(ActionType.ChangeQuestValue, new QuestValueChangeRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory));
            _actionRenderes.Add(ActionType.ChangeQuestState, new SetQuestStateActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory));
            _actionRenderes.Add(ActionType.AddQuestText, new AddQuestTextRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory));
            _actionRenderes.Add(ActionType.ChangeCurrentSkillValue, new CurrentSkillValueChangeRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory));
            _actionRenderes.Add(ActionType.Wait, new WaitActionRenderer(defaultTemplateProvider, localizerFactory));
            _actionRenderes.Add(ActionType.ChangePlayerState, new ChangeNpcStateActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true));
            _actionRenderes.Add(ActionType.ChangeNpcState, new ChangeNpcStateActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false));
            _actionRenderes.Add(ActionType.ChangeTargetNpcState, new ChangeTargetNpcStateActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory));
            _actionRenderes.Add(ActionType.PlayerLearnSkill, new LearnForgetSkillActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true, true));
            _actionRenderes.Add(ActionType.PlayerForgetSkill, new LearnForgetSkillActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true, false));
            _actionRenderes.Add(ActionType.NpcLearnSkill, new LearnForgetSkillActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false, true));
            _actionRenderes.Add(ActionType.NpcForgetSkill, new LearnForgetSkillActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false, false));
            _actionRenderes.Add(ActionType.ChangePlayerSkillValue, new SkillValueChangeRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true));
            _actionRenderes.Add(ActionType.ChangeNpcSkillValue, new SkillValueChangeRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false));
            _actionRenderes.Add(ActionType.PersistDialogState, new PersistDialogStateActionRenderer(defaultTemplateProvider));
            _actionRenderes.Add(ActionType.OpenShop, new OpenShopActionRenderer(defaultTemplateProvider));
            _actionRenderes.Add(ActionType.PlayNpcAnimation, new PlayAnimationActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false));
            _actionRenderes.Add(ActionType.PlayPlayerAnimation, new PlayAnimationActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true));
            _actionRenderes.Add(ActionType.CodeAction, new CodeActionRenderer(defaultTemplateProvider, localizerFactory));
            _actionRenderes.Add(ActionType.ShowFloatingTextAboveNpc, new ShowFloatingTextAboveNpcActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false));
            _actionRenderes.Add(ActionType.ShowFloatingTextAbovePlayer, new ShowFloatingTextAboveNpcActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true));
            _actionRenderes.Add(ActionType.ShowFloatingTextAboveChooseNpc, new ShowFloatingTextAboveChooseNpcActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory));
            _actionRenderes.Add(ActionType.FadeToBlack, new FadeToFromBlackRenderer(defaultTemplateProvider, localizerFactory, true));
            _actionRenderes.Add(ActionType.FadeFromBlack, new FadeToFromBlackRenderer(defaultTemplateProvider, localizerFactory, false));
            _actionRenderes.Add(ActionType.SetGameTime, new SetGameTimeActionRenderer(defaultTemplateProvider, cachedDbAccess, localizerFactory));
            _actionRenderes.Add(ActionType.DisableDailyRoutineEvent, new SetDailyRoutineEventState(defaultTemplateProvider, cachedDbAccess, dailyRoutineEventPlaceholderResolver, languageKeyGenerator, localizerFactory, true));
            _actionRenderes.Add(ActionType.EnableDailyRoutineEvent, new SetDailyRoutineEventState(defaultTemplateProvider, cachedDbAccess, dailyRoutineEventPlaceholderResolver, languageKeyGenerator, localizerFactory, false));
            _actionRenderes.Add(ActionType.TeleportNpc, new MoveNpcActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true, false, false));
            _actionRenderes.Add(ActionType.TeleportPlayer, new MoveNpcActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true, true, false));
            _actionRenderes.Add(ActionType.TeleportChooseNpc, new MoveNpcActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true, false, true));
            _actionRenderes.Add(ActionType.WalkNpcToMarker, new MoveNpcActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false, false, false));
            _actionRenderes.Add(ActionType.WalkChooseNpcToMarker, new MoveNpcActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false, false, true));
            _actionRenderes.Add(ActionType.TeleportNpcToNpc, new MoveNpcToNpcActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true, false));
            _actionRenderes.Add(ActionType.TeleportChooseNpcToNpc, new MoveNpcToNpcActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true, true));
            _actionRenderes.Add(ActionType.WalkNpcToNpc, new MoveNpcToNpcActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false, false));
            _actionRenderes.Add(ActionType.WalkChooseNpcToNpc, new MoveNpcToNpcActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false, true));
            _actionRenderes.Add(ActionType.SpawnNpcAtMarker, new SpawnNpcAtMarkerRender(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory));
            _actionRenderes.Add(ActionType.SpawnItemAtMarker, new SpawnItemAtMarkerRender(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory));
            _actionRenderes.Add(ActionType.ChangeItemValue, new ItemValueChangeRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory));
            _actionRenderes.Add(ActionType.SpawnItemInChooseNpcInventory, new InventoryActionChooseNpcRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false));
            _actionRenderes.Add(ActionType.RemoveItemFromChooseNpcInventory, new InventoryActionChooseNpcRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true));
            _actionRenderes.Add(ActionType.NpcUseItem, new UseItemActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false, false));
            _actionRenderes.Add(ActionType.PlayerUseItem, new UseItemActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, true, false));
            _actionRenderes.Add(ActionType.ChooseNpcUseItem, new UseItemActionRenderer(defaultTemplateProvider, cachedDbAccess, languageKeyGenerator, localizerFactory, false, true));
        }

        /// <summary>
        /// Renders a dialog step
        /// </summary>
        /// <param name="data">Dialog Step Data</param>
        /// <param name="flexFieldObject">Flex Field to which the dialog belongs</param>
        /// <returns>Dialog Step Render Result</returns>
        public async Task<ExportDialogStepRenderResult> RenderDialogStep(ExportDialogData data, FlexFieldObject flexFieldObject)
        {
            ActionNode actionNode = data.Action;
            if(actionNode == null)
            {
                return null;
            }
            
            IActionRenderer actionRenderer = GetActionRenderForNode(actionNode);

            ExportDialogDataChild nextStep = null;
            if(data.Children != null)
            {
                if(actionRenderer != null)
                {
                    nextStep = actionRenderer.GetNextStep(data.Children);
                }
                else
                {
                    nextStep = data.Children.FirstOrDefault();
                }
            }

            string actionContent = await BuildActionContent(actionRenderer, actionNode, data, flexFieldObject);

            ExportTemplate template = await _defaultTemplateProvider.GetDefaultTemplateByType(_project.Id, TemplateType.TaleAction);

            ExportDialogStepRenderResult renderResult = new ExportDialogStepRenderResult();
            renderResult.StepCode = ExportUtil.BuildPlaceholderRegex(Placeholder_ActionContent).Replace(template.Code, actionContent);
            renderResult.StepCode = ReplaceBaseStepPlaceholders(renderResult.StepCode, data, nextStep != null ? nextStep.Child : null);

            return renderResult;
        }

        /// <summary>
        /// Returns the valid action renderer for a node
        /// </summary>
        /// <param name="actionNode">Action Node</param>
        /// <returns>Action renderer</returns>
        private IActionRenderer GetActionRenderForNode(ActionNode actionNode)
        {
            ActionType actionType = (ActionType)actionNode.ActionType;
            if(!_actionRenderes.ContainsKey(actionType))
            {
                _errorCollection.AddDialogUnknownActionTypeError(actionNode.ActionType);
                return null;
            }

            return _actionRenderes[actionType];
        }

        /// <summary>
        /// Builds the action content
        /// </summary>
        /// <param name="actionRenderer">Action Renderer</param>
        /// <param name="actionNode">Action Node</param>
        /// <param name="data">Dialog data</param>
        /// <param name="flexFieldObject">Flex field object to which the dialog belongs</param>
        /// <returns>Action content</returns>
        private async Task<string> BuildActionContent(IActionRenderer actionRenderer, ActionNode actionNode, ExportDialogData data, FlexFieldObject flexFieldObject)
        {
            if(actionRenderer == null)
            {
                return string.Empty;
            }

            return await actionRenderer.BuildActionElement(actionNode, data, _project, _errorCollection, flexFieldObject, _exportSettings);
        }
    
        /// <summary>
        /// Builds a parent text preview for the a dialog step
        /// </summary>
        /// <param name="child">Child node</param>
        /// <param name="parent">Parent</param>
        /// <param name="flexFieldObject">Flex Field to which the dialog belongs</param>
        /// <param name="errorCollection">Error Collection</param>
        /// <returns>Parent text preview for the dialog step</returns>
        public async Task<string> BuildParentTextPreview(ExportDialogData child, ExportDialogData parent, FlexFieldObject flexFieldObject, ExportPlaceholderErrorCollection errorCollection)
        {
            ActionNode actionNode = parent.Action;
            if(actionNode == null)
            {
                return null;
            }

            IActionRenderer actionRenderer = GetActionRenderForNode(actionNode);
            if(actionRenderer == null)
            {
                return string.Empty;
            }

            return await actionRenderer.BuildPreviewText(actionNode, flexFieldObject, errorCollection, child, parent);
        }

        /// <summary>
        /// Returns if the dialog renderer has placeholders for a template type
        /// </summary>
        /// <param name="templateType">Tempalte Type to check</param>
        /// <returns>true if the dialog renderer has placeholders for the template type</returns>
        public bool HasPlaceholdersForTemplateType(TemplateType templateType)
        {
            foreach(IActionRenderer curRenderer in _actionRenderes.Values)
            {
                if(curRenderer.HasPlaceholdersForTemplateType(templateType))
                {
                    return true;
                }
            }

            return templateType == TemplateType.TaleAction;
        }

        /// <summary>
        /// Returns the placeholders for a template
        /// </summary>
        /// <param name="templateType">Template Type</param>
        /// <returns>List of template placeholders</returns>
        public List<ExportTemplatePlaceholder> GetPlaceholdersForTemplate(TemplateType templateType)
        {
            if(!HasPlaceholdersForTemplateType(templateType))
            {
                return new List<ExportTemplatePlaceholder>();
            }

            List<ExportTemplatePlaceholder> placeholders = GetBasePlaceholdersForTemplate();
            if(templateType == TemplateType.TaleAction)
            {
                placeholders.AddRange(new List<ExportTemplatePlaceholder> {
                    ExportUtil.CreatePlaceHolder(Placeholder_ActionContent, _localizer)
                });
            }

            foreach(IActionRenderer curRenderer in _actionRenderes.Values)
            {
                if(curRenderer.HasPlaceholdersForTemplateType(templateType))
                {
                    placeholders.AddRange(curRenderer.GetExportTemplatePlaceholdersForType(templateType));
                }
            }

            return placeholders;
        }
    }
}