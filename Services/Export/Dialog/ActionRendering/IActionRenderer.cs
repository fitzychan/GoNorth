using System.Collections.Generic;
using System.Threading.Tasks;
using GoNorth.Data.Exporting;
using GoNorth.Data.FlexFieldDatabase;
using GoNorth.Data.Kortisto;
using GoNorth.Data.NodeGraph;
using GoNorth.Data.Project;
using GoNorth.Services.Export.Placeholder;

namespace GoNorth.Services.Export.Dialog.ActionRendering
{
    /// <summary>
    /// Interface for action rendering
    /// </summary>
    public interface IActionRenderer
    {
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
        Task<string> BuildActionElement(ActionNode action, ExportDialogData data, GoNorthProject project, ExportPlaceholderErrorCollection errorCollection, FlexFieldObject flexFieldObject, ExportSettings exportSettings);

        /// <summary>
        /// Builds the preview text for an action
        /// </summary>
        /// <param name="action">Action</param>
        /// <param name="flexFieldObject">Flex field object to which the dialog belongs</param>
        /// <param name="errorCollection">Error Collection</param>
        /// <param name="child">Child node</param>
        /// <param name="parent">Parent</param>
        /// <returns>Preview Text</returns>
        Task<string> BuildPreviewText(ActionNode action, FlexFieldObject flexFieldObject, ExportPlaceholderErrorCollection errorCollection, ExportDialogData child, ExportDialogData parent);

        /// <summary>
        /// Returns true if the action renderer has placeholders for a template type
        /// </summary>
        /// <param name="templateType">Tempalte Type to check</param>
        /// <returns>true if the action renderer has placeholders for the template type</returns>
        bool HasPlaceholdersForTemplateType(TemplateType templateType);

        /// <summary>
        /// Returns the Export Template Placeholders for a Template Type
        /// </summary>
        /// <param name="templateType">Template Type</param>
        /// <returns>Export Template Placeholder</returns>
        List<ExportTemplatePlaceholder> GetExportTemplatePlaceholdersForType(TemplateType templateType);


        /// <summary>
        /// Returns the next step from a list of children
        /// </summary>
        /// <param name="children">Children to read</param>
        /// <returns>Next Step</returns>
        ExportDialogDataChild GetNextStep(List<ExportDialogDataChild> children);
    }
}