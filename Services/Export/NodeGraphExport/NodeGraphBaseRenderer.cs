using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GoNorth.Data.Exporting;
using GoNorth.Data.FlexFieldDatabase;
using GoNorth.Data.Project;
using GoNorth.Services.Export.Data;
using GoNorth.Services.Export.Dialog;
using GoNorth.Services.Export.LanguageKeyGeneration;
using GoNorth.Services.Export.Placeholder;
using Microsoft.Extensions.Localization;

namespace GoNorth.Services.Export.NodeGraphExport
{
    /// <summary>
    /// Base Class for Rendering a Node Graph Dialog
    /// </summary>
    public abstract class NodeGraphBaseRenderer
    {
        /// <summary>
        /// Error Collection
        /// </summary>
        protected ExportPlaceholderErrorCollection _errorCollection;

        /// <summary>
        /// Export default template provider
        /// </summary>
        protected readonly ICachedExportDefaultTemplateProvider _defaultTemplateProvider;

        /// <summary>
        /// Cached Db Access
        /// </summary>
        protected readonly IExportCachedDbAccess _cachedDbAccess;

        /// <summary>
        /// Language Key Generator
        /// </summary>
        protected readonly ILanguageKeyGenerator _languageKeyGenerator;

        /// <summary>
        /// Condition Renderer
        /// </summary>
        protected readonly IConditionRenderer _conditionRenderer;

        /// <summary>
        /// Daily routine event placeholder resolver
        /// </summary>
        protected readonly IDailyRoutineEventPlaceholderResolver _dailyRoutineEventPlaceholderResolver;

        /// <summary>
        /// String Localizer Factory
        /// </summary>
        protected readonly IStringLocalizerFactory _stringLocalizerFactory;

        /// <summary>
        /// Step Rendereres
        /// </summary>
        protected List<IExportDialogStepRenderer> _stepRenderers;

        /// <summary>
        /// Current Project
        /// </summary>
        protected GoNorthProject _curProject;

        /// <summary>
        /// Export Settings
        /// </summary>
        protected ExportSettings _exportSettings;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="defaultTemplateProvider">Default Template Provider</param>
        /// <param name="cachedDbAccess">Cached Db Access</param>
        /// <param name="languageKeyGenerator">Language Key Generator</param>
        /// <param name="conditionRenderer">Condition Renderer</param>
        /// <param name="dailyRoutineEventPlaceholderResolver">Daily routine event placeholder resolver</param>
        /// <param name="stringLocalizerFactory">String Localizer Factor</param>
        public NodeGraphBaseRenderer(ICachedExportDefaultTemplateProvider defaultTemplateProvider, IExportCachedDbAccess cachedDbAccess, ILanguageKeyGenerator languageKeyGenerator,
                                     IConditionRenderer conditionRenderer, IDailyRoutineEventPlaceholderResolver dailyRoutineEventPlaceholderResolver, IStringLocalizerFactory stringLocalizerFactory)
        {
            _defaultTemplateProvider = defaultTemplateProvider;
            _cachedDbAccess = cachedDbAccess;
            _languageKeyGenerator = languageKeyGenerator;
            _conditionRenderer = conditionRenderer;
            _dailyRoutineEventPlaceholderResolver = dailyRoutineEventPlaceholderResolver;
            _stringLocalizerFactory = stringLocalizerFactory;
            _stepRenderers = new List<IExportDialogStepRenderer>();
        }

        /// <summary>
        /// Sets the error collection
        /// </summary>
        /// <param name="errorCollection">Error Collection</param>
        public void SetErrorCollection(ExportPlaceholderErrorCollection errorCollection)
        {
            _errorCollection = errorCollection;
        }

        /// <summary>
        /// Extracts all additional dialog functions
        /// </summary>
        /// <param name="exportDialog">Dialog data</param>
        /// <returns>Additional dialog functions</returns>
        protected List<ExportDialogFunction> ExtractAdditionalFunctions(ExportDialogData exportDialog)
        {
            List<ExportDialogFunction> additionalDialogFunctions = new List<ExportDialogFunction>();
            HashSet<ExportDialogData> usedNodesForFunctions = new HashSet<ExportDialogData>();
            Queue<ExportDialogData> dataForFunctions = new Queue<ExportDialogData>();
            foreach (ExportDialogDataChild curChild in exportDialog.Children)
            {
                dataForFunctions.Enqueue(curChild.Child);
                usedNodesForFunctions.Add(curChild.Child);
            }

            while (dataForFunctions.Any())
            {
                ExportDialogData curDialogData = dataForFunctions.Dequeue();
                if (!string.IsNullOrEmpty(curDialogData.DialogStepFunctionName))
                {
                    ExportDialogFunction curAdditionalDialogFunction = new ExportDialogFunction(curDialogData);
                    AddNodesToFunction(curAdditionalDialogFunction, curDialogData);
                    additionalDialogFunctions.Add(curAdditionalDialogFunction);
                }

                foreach (ExportDialogDataChild curChild in curDialogData.Children)
                {
                    if (!usedNodesForFunctions.Contains(curChild.Child))
                    {
                        dataForFunctions.Enqueue(curChild.Child);
                        usedNodesForFunctions.Add(curChild.Child);
                    }
                }
            }

            return additionalDialogFunctions;
        }

        /// <summary>
        /// Adds all nodes that do not start a new function to a dialog function
        /// </summary>
        /// <param name="targetFunction">Target Function</param>
        /// <param name="exportDialog">Dialog step to check</param>
        protected void AddNodesToFunction(ExportDialogFunction targetFunction, ExportDialogData exportDialog)
        {
            if (targetFunction.FunctionSteps.Contains(exportDialog))
            {
                return;
            }

            targetFunction.FunctionSteps.Add(exportDialog);
            foreach (ExportDialogDataChild curChild in exportDialog.Children)
            {
                if (string.IsNullOrEmpty(curChild.Child.DialogStepFunctionName))
                {
                    AddNodesToFunction(targetFunction, curChild.Child);
                }
            }
        }

        /// <summary>
        /// Renders a dialog function
        /// </summary>
        /// <param name="additionalFunction">additionalFunction</param>
        /// <param name="flexFieldObject">Flex field object to which the dialog belongs</param>
        /// <returns>Dialog function code</returns>
        protected async Task<string> RenderDialogFunction(ExportDialogFunction additionalFunction, FlexFieldObject flexFieldObject)
        {
            string functionCode = await RenderDialogStepList(additionalFunction.FunctionSteps, flexFieldObject);
            return await BuildDialogFunctionCode(additionalFunction, functionCode, flexFieldObject);
        }

        /// <summary>
        /// Renders a list of dialog steps
        /// </summary>
        /// <param name="functionSteps">Steps to render</param>
        /// <param name="flexFieldObject">Flex field object to which the dialog belongs</param>
        /// <returns>Renderd code for list of dialog steps</returns>
        protected async Task<string> RenderDialogStepList(List<ExportDialogData> functionSteps, FlexFieldObject flexFieldObject)
        {
            string stepListCode = string.Empty;
            foreach (ExportDialogData curData in functionSteps)
            {
                ExportDialogStepRenderResult renderResult = await RenderDialogStep(curData, flexFieldObject);
                stepListCode += renderResult.StepCode;
            }
            return stepListCode;
        }

        /// <summary>
        /// Renders a dialog step
        /// </summary>
        /// <param name="exportDialog">Cur Data to render</param>
        /// <param name="flexFieldObject">Flex field object to which the dialog belongs</param>
        /// <returns>Result of the rendering of the step</returns>
        protected async Task<ExportDialogStepRenderResult> RenderDialogStep(ExportDialogData exportDialog, FlexFieldObject flexFieldObject)
        {
            foreach (IExportDialogStepRenderer curRenderer in _stepRenderers)
            {
                ExportDialogStepRenderResult result = await curRenderer.RenderDialogStep(exportDialog, flexFieldObject);
                if (result != null)
                {
                    return result;
                }
            }

            _errorCollection.AddUnknownDialogStepError();
            return null;
        }

        /// <summary>
        /// Builds the dialog function code
        /// </summary>
        /// <param name="additionalFunction">Function</param>
        /// <param name="additionalFunctionsCode">Additional Function Code to wrap</param>
        /// <param name="flexFieldObject">Flex field object to which the dialog belongs</param>
        /// <returns>Function Code</returns>
        protected abstract Task<string> BuildDialogFunctionCode(ExportDialogFunction additionalFunction, string additionalFunctionsCode, FlexFieldObject flexFieldObject);

        /// <summary>
        /// Builds a preview for the parents of a function
        /// </summary>
        /// <param name="additionalFunction">Function</param>
        /// <param name="flexFieldObject">Flex field object to which the dialog belongs</param>
        /// <returns>Preview of the parents of the function</returns>
        protected async Task<string> BuildFunctionParentPreview(ExportDialogFunction additionalFunction, FlexFieldObject flexFieldObject)
        {
            if (additionalFunction.RootNode.Parents == null)
            {
                return string.Empty;
            }

            List<string> previewLines = new List<string>();
            foreach (ExportDialogData curParent in additionalFunction.RootNode.Parents)
            {
                foreach (IExportDialogStepRenderer curRenderer in _stepRenderers)
                {
                    string stepPreview = await curRenderer.BuildParentTextPreview(additionalFunction.RootNode, curParent, flexFieldObject, _errorCollection);
                    if (stepPreview != null)
                    {
                        previewLines.Add(stepPreview);
                        continue;
                    }
                }
            }
            return string.Join(", ", previewLines);
        }


        /// <summary>
        /// Prepares all step renderes
        /// </summary>
        protected abstract void SetupStepRenderes();
    }
}