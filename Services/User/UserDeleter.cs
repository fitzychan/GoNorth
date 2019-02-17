using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GoNorth.Data.Aika;
using GoNorth.Data.Evne;
using GoNorth.Data.Exporting;
using GoNorth.Data.Karta;
using GoNorth.Data.Kirja;
using GoNorth.Data.Kortisto;
using GoNorth.Data.LockService;
using GoNorth.Data.Styr;
using GoNorth.Data.Tale;
using GoNorth.Data.TaskManagement;
using GoNorth.Data.Timeline;
using GoNorth.Data.User;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GoNorth.Services.User
{
    /// <summary>
    /// Class for User Deleter service
    /// </summary>
    public class UserDeleter : IUserDeleter
    {
        /// <summary>
        /// Quest Db Access
        /// </summary>
        private readonly IAikaQuestDbAccess _questDbAccess;

        /// <summary>
        /// Chapter Detail Db Access
        /// </summary>
        private readonly IAikaChapterDetailDbAccess _chapterDetailDbAccess;

        /// <summary>
        /// Chapter Overview Db Access
        /// </summary>
        private readonly IAikaChapterOverviewDbAccess _chapterOverviewDbAccess;

        /// <summary>
        /// Skill Db Access
        /// </summary>
        private readonly IEvneSkillDbAccess _skillDbAccess;

        /// <summary>
        /// Npc Db Access
        /// </summary>
        private readonly IKortistoNpcDbAccess _npcDbAccess;

        /// <summary>
        /// Item Db Access
        /// </summary>
        private readonly IStyrItemDbAccess _itemDbAccess;

        /// <summary>
        /// Export Template Db Access
        /// </summary>
        private readonly IExportTemplateDbAccess _exportTemplateDbAccess;

        /// <summary>
        /// Map Db Access
        /// </summary>
        private readonly IKartaMapDbAccess _mapDbAccess;

        /// <summary>
        /// Page Db Access
        /// </summary>
        private readonly IKirjaPageDbAccess _pageDbAccess;

        /// <summary>
        /// Page Version Db Access
        /// </summary>
        private readonly IKirjaPageVersionDbAccess _pageVersionDbAccess;

        /// <summary>
        /// Tale Db Access
        /// </summary>
        private readonly ITaleDbAccess _taleDbAccess;

        /// <summary>
        /// Task Board Db Access
        /// </summary>
        private readonly ITaskBoardDbAccess _taskBoardDbAccess;

        /// <summary>
        /// Lock Db Service
        /// </summary>
        private readonly ILockServiceDbAccess _lockDbService;

        /// <summary>
        /// Timeline Db Access
        /// </summary>
        private readonly ITimelineDbAccess _timelineDbAccess;

        /// <summary>
        /// User Task Board History Db Access
        /// </summary>
        private readonly IUserTaskBoardHistoryDbAccess _userTaskBoardHistoryDbAccess;

        /// <summary>
        /// User manager
        /// </summary>
        private readonly UserManager<GoNorthUser> _userManager;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="questDbAccess">Quest Db Access</param>
        /// <param name="chapterDetailDbAccess">Chapter Detail Db Access</param>
        /// <param name="chapterOverviewDbAccess">Chapter Overview Db Access</param>
        /// <param name="skillDbAccess">Skill Db Access</param>
        /// <param name="npcDbAccess">Npc Db Access</param>
        /// <param name="itemDbAccess">Item Db Access</param>
        /// <param name="exportTemplateDbAccess">Export template Db access</param>
        /// <param name="mapDbAccess">Map Db Access</param>
        /// <param name="pageDbAccess">Page Db Access</param>
        /// <param name="pageVersionDbAccess">Page Version Db Access</param>
        /// <param name="taleDbAccess">Tale Db Access</param>
        /// <param name="taskBoardDbAccess">Task Bord Db Access</param>
        /// <param name="userTaskBoardHistoryDbAccess">User Task Board History</param>
        /// <param name="lockDbService">Lock Db Service</param>
        /// <param name="timelineDbAccess">Timeline Db Access</param>
        /// <param name="userManager">User manager</param>
        public UserDeleter(IAikaQuestDbAccess questDbAccess, IAikaChapterDetailDbAccess chapterDetailDbAccess, IAikaChapterOverviewDbAccess chapterOverviewDbAccess, IEvneSkillDbAccess skillDbAccess, IKortistoNpcDbAccess npcDbAccess, 
                           IStyrItemDbAccess itemDbAccess, IExportTemplateDbAccess exportTemplateDbAccess, IKartaMapDbAccess mapDbAccess, IKirjaPageDbAccess pageDbAccess, IKirjaPageVersionDbAccess pageVersionDbAccess, ITaleDbAccess taleDbAccess, 
                           ITaskBoardDbAccess taskBoardDbAccess, IUserTaskBoardHistoryDbAccess userTaskBoardHistoryDbAccess, ILockServiceDbAccess lockDbService, ITimelineDbAccess timelineDbAccess, UserManager<GoNorthUser> userManager)
        {
            _questDbAccess = questDbAccess;
            _chapterDetailDbAccess = chapterDetailDbAccess;
            _chapterOverviewDbAccess = chapterOverviewDbAccess;
            _skillDbAccess = skillDbAccess;
            _npcDbAccess = npcDbAccess;
            _itemDbAccess = itemDbAccess;
            _exportTemplateDbAccess = exportTemplateDbAccess;
            _mapDbAccess = mapDbAccess;
            _pageDbAccess = pageDbAccess;
            _pageVersionDbAccess = pageVersionDbAccess;
            _taleDbAccess = taleDbAccess;
            _taskBoardDbAccess = taskBoardDbAccess;
            _userTaskBoardHistoryDbAccess = userTaskBoardHistoryDbAccess;
            _lockDbService = lockDbService;
            _timelineDbAccess = timelineDbAccess;
            _userManager = userManager;
        }

        /// <summary>
        /// Deletes a user and all associated data
        /// </summary>
        /// <param name="user">User</param>
        /// <returns>Deletion result</returns>
        public async Task<IdentityResult> DeleteUser(GoNorthUser user)
        {
            await DeleteModifiedData(user);
            await ResetAssignedTasks(user);
            await DeleteUserTaskBoardHistory(user);
            await DeleteTimelineEvents(user);
            await DeleteLocksOfUser(user);

            IdentityResult result = await _userManager.DeleteAsync(user);
            return result;
        }

        /// <summary>
        /// Deletes the modified data for the user
        /// </summary>
        /// <param name="user">User</param>
        /// <returns>Task</returns>
        private async Task DeleteModifiedData(GoNorthUser user)
        {
            List<AikaQuest> quests = await _questDbAccess.GetQuestsByModifiedUser(user.Id);
            foreach(AikaQuest curQuest in quests)
            {
                curQuest.ModifiedBy = Guid.Empty.ToString();
                curQuest.ModifiedOn = DateTimeOffset.UtcNow;
                await _questDbAccess.UpdateQuest(curQuest);
            }

            List<AikaChapterDetail> chapterDetail = await _chapterDetailDbAccess.GetChapterDetailsByModifiedUser(user.Id);
            foreach(AikaChapterDetail curChapterDetail in chapterDetail)
            {
                curChapterDetail.ModifiedBy = Guid.Empty.ToString();
                curChapterDetail.ModifiedOn = DateTimeOffset.UtcNow;
                await _chapterDetailDbAccess.UpdateChapterDetail(curChapterDetail);
            }

            List<AikaChapterOverview> chapterOverview = await _chapterOverviewDbAccess.GetChapterOverviewByModifiedUser(user.Id);
            foreach(AikaChapterOverview curOverview in chapterOverview)
            {
                curOverview.ModifiedBy = Guid.Empty.ToString();
                curOverview.ModifiedOn = DateTimeOffset.UtcNow;
                await _chapterOverviewDbAccess.UpdateChapterOverview(curOverview);
            }

            List<EvneSkill> skills = await _skillDbAccess.GetFlexFieldObjectsByModifiedUser(user.Id);
            foreach(EvneSkill curSkill in skills)
            {
                curSkill.ModifiedBy = Guid.Empty.ToString();
                curSkill.ModifiedOn = DateTimeOffset.UtcNow;
                await _skillDbAccess.UpdateFlexFieldObject(curSkill);
            }

            List<KortistoNpc> npcs = await _npcDbAccess.GetFlexFieldObjectsByModifiedUser(user.Id);
            foreach(KortistoNpc curNpc in npcs)
            {
                curNpc.ModifiedBy = Guid.Empty.ToString();
                curNpc.ModifiedOn = DateTimeOffset.UtcNow;
                await _npcDbAccess.UpdateFlexFieldObject(curNpc);
            }

            List<StyrItem> items = await _itemDbAccess.GetFlexFieldObjectsByModifiedUser(user.Id);
            foreach(StyrItem curItem in items)
            {
                curItem.ModifiedBy = Guid.Empty.ToString();
                curItem.ModifiedOn = DateTimeOffset.UtcNow;
                await _itemDbAccess.UpdateFlexFieldObject(curItem);
            }

            List<ExportTemplate> exportTemplates = await _exportTemplateDbAccess.GetExportTemplatesByModifiedUser(user.Id);
            foreach(ExportTemplate curTemplate in exportTemplates)
            {
                curTemplate.ModifiedBy = Guid.Empty.ToString();
                curTemplate.ModifiedOn = DateTimeOffset.UtcNow;
                await _exportTemplateDbAccess.UpdateTemplate(curTemplate);
            }
            
            List<KartaMap> maps = await _mapDbAccess.GetMapsByModifiedUser(user.Id);
            foreach(KartaMap curMap in maps)
            {
                curMap.ModifiedBy = Guid.Empty.ToString();
                curMap.ModifiedOn = DateTimeOffset.UtcNow;
                await _mapDbAccess.UpdateMap(curMap);
            }

            List<KirjaPage> pages = await _pageDbAccess.GetPagesByModifiedUser(user.Id);
            foreach(KirjaPage curPage in pages)
            {
                curPage.ModifiedBy = Guid.Empty.ToString();
                curPage.ModifiedOn = DateTimeOffset.UtcNow;
                await _pageDbAccess.UpdatePage(curPage);
            }

            List<KirjaPageVersion> pageVersions = await _pageVersionDbAccess.GetPageVersionsByModifiedUser(user.Id);
            foreach(KirjaPageVersion curVersion in pageVersions)
            {
                curVersion.ModifiedBy = Guid.Empty.ToString();
                curVersion.ModifiedOn = DateTimeOffset.UtcNow;
                await _pageVersionDbAccess.UpdatePageVersion(curVersion);
            }

            List<TaleDialog> dialogs = await _taleDbAccess.GetDialogsByModifiedUser(user.Id);
            foreach(TaleDialog curDialog in dialogs)
            {
                curDialog.ModifiedBy = Guid.Empty.ToString();
                curDialog.ModifiedOn = DateTimeOffset.UtcNow;
                await _taleDbAccess.UpdateDialog(curDialog);
            }

            List<TaskBoard> taskBoards = await _taskBoardDbAccess.GetTaskBoardsByModifiedUser(user.Id);
            foreach(TaskBoard curBoard in taskBoards)
            {
                if(curBoard.ModifiedBy == user.Id)
                {
                    curBoard.ModifiedBy = Guid.Empty.ToString();
                    curBoard.ModifiedOn = DateTimeOffset.UtcNow;
                }

                List<TaskGroup> modifiedGroups = curBoard.TaskGroups.Where(t => t.ModifiedBy == user.Id).ToList();
                foreach(TaskGroup curTaskGroup in modifiedGroups)
                {
                    curTaskGroup.ModifiedBy = Guid.Empty.ToString();
                    curTaskGroup.ModifiedOn = DateTimeOffset.UtcNow;
                }

                List<GoNorthTask> tasks = curBoard.TaskGroups.SelectMany(p => p.Tasks.Where(t => t.ModifiedBy == user.Id)).ToList();
                if(tasks.Count > 0)
                {
                    foreach(GoNorthTask curTask in tasks)
                    {
                        curTask.ModifiedBy = Guid.Empty.ToString();
                        curTask.ModifiedOn = DateTimeOffset.UtcNow;
                    }
                }

                await _taskBoardDbAccess.UpdateTaskBoard(curBoard);
            }
        }
        
        /// <summary>
        /// Resets the assigned tasks for a user
        /// </summary>
        /// <param name="user">User</param>
        /// <returns>Task</returns>
        private async Task ResetAssignedTasks(GoNorthUser user)
        {
            List<TaskBoard> taskBoards = await _taskBoardDbAccess.GetAllTaskBoardsByAssignedUser(user.Id);
            foreach(TaskBoard curBoard in taskBoards)
            {
                bool changedBoard = false;
                foreach(TaskGroup curTaskGroup in curBoard.TaskGroups)
                {
                    if(curTaskGroup.AssignedTo == user.Id)
                    {
                        curTaskGroup.AssignedTo = null;
                        changedBoard = true;
                    }

                    foreach(GoNorthTask curTask in curTaskGroup.Tasks)
                    {
                        if(curTask.AssignedTo == user.Id)
                        {
                            curTask.AssignedTo = null;
                            changedBoard = true;
                        }
                    }
                }

                if(changedBoard)
                {
                    await _taskBoardDbAccess.UpdateTaskBoard(curBoard);
                }
            }
        }
        
        /// <summary>
        /// Deletes the user task board history
        /// </summary>
        /// <param name="user">User</param>
        /// <returns>Task</returns>
        private async Task DeleteUserTaskBoardHistory(GoNorthUser user)
        {
            await _userTaskBoardHistoryDbAccess.DeleteUserTaskBoardHistoryForUser(user.Id);
        }

        /// <summary>
        /// Deletes the timeline events of a user
        /// </summary>
        /// <param name="user">User</param>
        /// <returns>Task</returns>
        private async Task DeleteTimelineEvents(GoNorthUser user)
        {
            await _timelineDbAccess.DeleteTimelineEntriesOfUser(user.UserName);
        }
        
        /// <summary>
        /// Deletes all locks of a user
        /// </summary>
        /// <param name="user">User</param>
        /// <returns>Task</returns>
        private async Task DeleteLocksOfUser(GoNorthUser user)
        {
            await _lockDbService.DeleteAllLocksOfUser(user.Id);
        }

    }
}
