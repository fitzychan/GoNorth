using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using GoNorth.Data.Exporting;
using GoNorth.Data.FlexFieldDatabase;
using GoNorth.Data.NodeGraph;
using GoNorth.Data.Project;
using GoNorth.Services.Export.Placeholder;

namespace GoNorth.Services.Export.Dialog.ActionRendering
{
    /// <summary>
    /// Base Class for action rendering
    /// </summary>
    public abstract class BaseActionRenderer<T> : IActionRenderer where T : class, new()
    {
        /// <summary>
        /// Parses the action data
        /// </summary>
        /// <param name="actionData">Action data to parse</param>
        /// <returns>Parsed data</returns>
        private T ParseActionData(string actionData)
        {
            if(actionData != null)
            {
                JsonSerializerOptions jsonOptions = new JsonSerializerOptions();
                jsonOptions.Converters.Add(new JsonStringEnumConverter());
                jsonOptions.PropertyNameCaseInsensitive = true;

                return JsonSerializer.Deserialize<T>(actionData, jsonOptions);
            }
            
            return new T();
        }

        /// <summary>
        /// Builds an action
        /// </summary>
        /// <param name="action">Current action</param>
        /// <param name="data">Dialog data</param>
        /// <param name="project">Project</param>
        /// <param name="errorCollection">Error Collection</param>
        /// <param name="flexFieldObject">Flex field object to which the dialog belongs</param>
        /// <param name="exportSettings">Export Settings</param>
        /// <returns>Action Build Result</returns>
        public async Task<string> BuildActionElement(ActionNode action, ExportDialogData data, GoNorthProject project, ExportPlaceholderErrorCollection errorCollection, FlexFieldObject flexFieldObject, ExportSettings exportSettings)
        {
            T parsedData = ParseActionData(action.ActionData);
            return await BuildActionFromParsedData(parsedData, data, project, errorCollection, flexFieldObject, exportSettings);
        }

        /// <summary>
        /// Builds an action from parsed data
        /// </summary>
        /// <param name="parsedData">Parsed data</param>
        /// <param name="data">Dialog data</param>
        /// <param name="project">Project</param>
        /// <param name="errorCollection">Error Collection</param>
        /// <param name="flexFieldObject">Flex field object to which the dialog belongs</param>
        /// <param name="exportSettings">Export Settings</param>
        /// <returns>Action string</returns>
        public abstract Task<string> BuildActionFromParsedData(T parsedData, ExportDialogData data, GoNorthProject project, ExportPlaceholderErrorCollection errorCollection, FlexFieldObject flexFieldObject, ExportSettings exportSettings);

        /// <summary>
        /// Builds the preview text for an action
        /// </summary>
        /// <param name="action">Action</param>
        /// <param name="flexFieldObject">Flex field object to which the dialog belongs</param>
        /// <param name="errorCollection">Error Collection</param>
        /// <param name="child">Child node</param>
        /// <param name="parent">Parent</param>
        /// <returns>Preview Text</returns>
        public async Task<string> BuildPreviewText(ActionNode action, FlexFieldObject flexFieldObject, ExportPlaceholderErrorCollection errorCollection, ExportDialogData child, ExportDialogData parent)
        {
            T parsedData = ParseActionData(action.ActionData);
            return await BuildPreviewTextFromParsedData(parsedData, flexFieldObject, errorCollection, child, parent);
        }

        /// <summary>
        /// Builds a preview text from parsed data
        /// </summary>
        /// <param name="parsedData">Parsed data</param>
        /// <param name="flexFieldObject">Flex field object to which the dialog belongs</param>
        /// <param name="errorCollection">Error Collection</param>
        /// <param name="child">Child node</param>
        /// <param name="parent">Parent</param>
        /// <returns>Preview text</returns>
        public abstract Task<string> BuildPreviewTextFromParsedData(T parsedData, FlexFieldObject flexFieldObject, ExportPlaceholderErrorCollection errorCollection, ExportDialogData child, ExportDialogData parent);

        /// <summary>
        /// Returns true if the action renderer has placeholders for a template type
        /// </summary>
        /// <param name="templateType">Tempalte Type to check</param>
        /// <returns>true if the action renderer has placeholders for the template type</returns>
        public abstract bool HasPlaceholdersForTemplateType(TemplateType templateType);

        /// <summary>
        /// Returns the Export Template Placeholders for a Template Type
        /// </summary>
        /// <param name="templateType">Template Type</param>
        /// <returns>Export Template Placeholder</returns>
        public abstract List<ExportTemplatePlaceholder> GetExportTemplatePlaceholdersForType(TemplateType templateType);


        /// <summary>
        /// Returns the next step from a list of children
        /// </summary>
        /// <param name="children">Children to read</param>
        /// <returns>Next Step</returns>
        public virtual ExportDialogDataChild GetNextStep(List<ExportDialogDataChild> children)
        {
            return children.FirstOrDefault();
        }
    }
}