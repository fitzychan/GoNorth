using System.Collections.Generic;
using GoNorth.Data.FlexFieldDatabase;
using GoNorth.Services.Export.Placeholder;
using GoNorth.Services.ImplementationStatusCompare;

namespace GoNorth.Data.Kortisto
{
    /// <summary>
    /// Kortisto Npc
    /// </summary>
    public class KortistoNpc : FlexFieldObject, IExportSnippetExportable
    {

        /// <summary>
        /// true if the npc is a player npc, else false
        /// </summary>
        [ValueCompareAttribute]
        public bool IsPlayerNpc { get; set; }

        /// <summary>
        /// Template of the Name Gen
        /// </summary>
        public string NameGenTemplate { get; set; }

        /// <summary>
        /// Inventory Items
        /// </summary>
        [ListCompareAttribute(LabelKey = "InventoryChanged")]
        public List<KortistoInventoryItem> Inventory { get; set; }

        /// <summary>
        /// Skill
        /// </summary>
        [ListCompareAttribute(LabelKey = "SkillChanged")]
        public List<KortistoNpcSkill> Skills { get; set; }
        
        /// <summary>
        /// Daily Routine
        /// </summary>
        [ListCompareAttribute(LabelKey = "DailyRoutineChanged")]
        public List<KortistoNpcDailyRoutineEvent> DailyRoutine { get; set; }
    }
}