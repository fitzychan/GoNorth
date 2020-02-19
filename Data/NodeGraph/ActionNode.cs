using System.Collections.Generic;
using GoNorth.Services.ImplementationStatusCompare;

namespace GoNorth.Data.NodeGraph
{
    /// <summary>
    /// Action Node
    /// </summary>
    public class ActionNode : BaseNode
    {
        /// <summary>
        /// Action Type
        /// </summary>
        [ValueCompareAttribute(LabelKey = "", TextKey = "ActionTypeChanged")]
        public int ActionType { get; set; }

        /// <summary>
        /// Action related to object type
        /// </summary>
        public string ActionRelatedToObjectType { get; set; }

        /// <summary>
        /// Action related to object id
        /// </summary>
        public string ActionRelatedToObjectId { get; set; } 

        /// <summary>
        /// Additional Object dependencies for the action
        /// </summary>
        public List<NodeObjectDependency> ActionRelatedToAdditionalObjects { get; set; }

        /// <summary>
        /// Action Data
        /// </summary>
        [ValueCompareAttribute(LabelKey = "", TextKey = "ActionDataChanged")]
        public string ActionData { get; set; }
    }
}
