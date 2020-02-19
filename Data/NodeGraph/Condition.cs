using System.Collections.Generic;
using System.Text.Json.Serialization;
using GoNorth.Services.ImplementationStatusCompare;

namespace GoNorth.Data.NodeGraph
{
    /// <summary>
    /// Condition
    /// </summary>
    public class Condition : IImplementationListComparable
    {
        /// <summary>
        /// Condition Id
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Object dependencies for the condition
        /// </summary>
        public List<NodeObjectDependency> DependsOnObjects { get; set; }

        /// <summary>
        /// Serialized condition elements
        /// </summary>
        [ValueCompareAttribute(LabelKey = "", TextKey = "ConditionDataChanged")]
        public string ConditionElements { get; set; }


        /// <summary>
        /// Id which is used in a list compare to detect deleted or new objects
        /// </summary>
        [JsonIgnore]
        public string ListComparableId { get { return Id.ToString(); } }

        /// <summary>
        /// Value which is used in a list compare for display
        /// </summary>
        [JsonIgnore]
        public CompareDifferenceValue ListComparableValue { get { return new CompareDifferenceValue("Condition", CompareDifferenceValue.ValueResolveType.LanguageKey); } }
    }
}
