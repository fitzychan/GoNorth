﻿using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using GoNorth.Data;
using GoNorth.Models;
using GoNorth.Services.Email;
using GoNorth.Services.Encryption;
using GoNorth.Data.User;
using GoNorth.Data.Role;
using GoNorth.Authentication;
using GoNorth.Config;
using GoNorth.Localization;
using System;
using System.Globalization;
using System.Collections.Generic;
using GoNorth.Data.Timeline;
using GoNorth.Services.Timeline;
using Microsoft.AspNetCore.Http;
using GoNorth.Data.Project;
using GoNorth.Data.Kortisto;
using GoNorth.Data.LockService;
using Microsoft.AspNetCore.HttpOverrides;
using GoNorth.Data.Kirja;
using GoNorth.Services.Kirja;
using GoNorth.Data.Karta;
using GoNorth.Services.Karta;
using GoNorth.Data.Tale;
using GoNorth.Data.Styr;
using GoNorth.Data.Aika;
using GoNorth.Data.TaskManagement;
using GoNorth.Services.TaskManagement;
using GoNorth.Services.ImplementationStatusCompare;
using Microsoft.AspNetCore.Localization;
using GoNorth.Services.User;
using GoNorth.Data.Evne;
using GoNorth.Services.FlexFieldThumbnail;
using GoNorth.Data.Exporting;
using GoNorth.Services.Export;
using GoNorth.Services.Export.Placeholder;
using GoNorth.Services.Export.LanguageKeyGeneration;
using GoNorth.Services.Export.Dialog;
using GoNorth.Services.Export.Data;
using GoNorth.Services.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Swagger;
using System.Reflection;
using System.IO;

namespace GoNorth
{
    /// <summary>
    /// Startup Class
    /// </summary>
    public class Startup
    {
        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="configuration">Configuration for the application</param>
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        /// <summary>
        /// Configuration
        /// </summary>
        public IConfiguration Configuration { get; }

        /// <summary>
        /// This method gets called by the runtime. Use this method to add services to the container.
        /// </summary>
        /// <param name="services">Services</param>
        public void ConfigureServices(IServiceCollection services)
        {
            ConfigurationData configData = Configuration.Get<ConfigurationData>();
            
            // Add Identity
            services.AddIdentity<GoNorthUser, GoNorthRole>(options => {
                // Password settings
                options.Password.RequireDigit = true;
                options.Password.RequiredLength = Constants.MinPasswordLength;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = true;
                options.Password.RequireLowercase = false;

                // Lockout settings
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);
                options.Lockout.MaxFailedAccessAttempts = 10;

                // User settings
                options.User.RequireUniqueEmail = true;
            }).AddUserManager<GoNorthUserManager>().AddRoleManager<GoNorthRoleManager>().
               AddUserStore<GoNorthUserStore>().AddRoleStore<GoNorthRoleStore>().AddErrorDescriber<GoNorthIdentityErrorDescriber>().
               AddUserValidator<GoNorthUserValidator>().AddDefaultTokenProviders();
            
            if(configData.Misc.UseGdpr)
            {
                services.Configure<CookiePolicyOptions>(options =>
                {
                    options.CheckConsentNeeded = context => true;
                    options.MinimumSameSitePolicy = SameSiteMode.None;
                });

                services.Configure<CookieTempDataProviderOptions>(options => {
                    options.Cookie.IsEssential = true;
                });
            }

            // Framework services
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

            // Application services
            services.AddTransient<IConfigViewAccess, AppSettingsConfigViewAccess>();

            services.AddTransient<IEmailSender, EmailSender>();
            services.AddTransient<IEncryptionService, AesEncryptionService>();
            services.AddTransient<IXssChecker, XssChecker>();
            services.AddTransient<ITimelineService, TimelineService>();
            services.AddTransient<ITimelineTemplateService, HtmlTimelineTemplateService>();

            services.AddTransient<IKortistoNpcImageAccess, KortistoFileSystemNpcImageAccess>();

            services.AddTransient<IStyrItemImageAccess, StyrFileSystemItemImageAccess>();

            services.AddTransient<IEvneSkillImageAccess, EvneFileSystemSkillImageAccess>();

            services.AddTransient<IKirjaPageParserService, KirjaPageParserService>();
            services.AddTransient<IKirjaFileAccess, KirjaFileSystemAccess>();

            services.AddTransient<IKartaImageProcessor, ImageSharpKartaImageProcessor>();
            services.AddTransient<IKartaImageAccess, KartaFileSystemImageAccess>();
            services.AddTransient<IKartaMarkerLabelSync, KartaMarkerLabelSync>();

            services.AddTransient<ITaskImageAccess, TaskImageFileSystemAccess>();
            services.AddTransient<ITaskImageParser, TaskImageParser>();
            services.AddTransient<ITaskNumberFill, TaskNumberFill>();
            services.AddTransient<ITaskTypeDefaultProvider, TaskTypeDefaultProvider>();

            services.AddTransient<IKortistoThumbnailService, ImageSharpKortistoThumbnailService>();
            services.AddTransient<IEvneThumbnailService, ImageSharpEvneThumbnailService>();
            services.AddTransient<IStyrThumbnailService, ImageSharpStyrThumbnailService>();

            services.AddTransient<IImplementationStatusComparer, GenericImplementationStatusComparer>();

            services.AddTransient<IUserCreator, UserCreator>();
            services.AddTransient<IUserDeleter, UserDeleter>();

            services.AddTransient<IExportTemplatePlaceholderResolver, ExportTemplatePlaceholderResolver>();
            services.AddTransient<IExportDialogParser, ExportDialogParser>();
            services.AddTransient<IExportDialogFunctionGenerator, ExportDialogFunctionGenerator>();
            services.AddTransient<IExportDialogRenderer, ExportDialogRenderer>();
            services.AddScoped<ILanguageKeyGenerator, LanguageKeyGenerator>();
            services.AddScoped<IExportDialogFunctionNameGenerator, ExportDialogFunctionNameGenerator>();
            services.AddTransient<IConditionRenderer, ConditionRenderer>();
            services.AddScoped<IExportCachedDbAccess, ExportCachedDbAccess>();

            services.AddScoped<GoNorthUserManager>();

            services.AddScoped<IUserClaimsPrincipalFactory<GoNorthUser>, GoNorthUserClaimsPrincipalFactory>();

            // Database
            services.AddScoped<ILockServiceDbAccess, LockServiceMongoDbAccess>();
            services.AddScoped<IUserDbAccess, UserMongoDbAccess>();
            services.AddScoped<IUserPreferencesDbAccess, UserPreferencesMongoDbAccess>();
            services.AddScoped<IRoleDbAccess, RoleMongoDbAccess>();
            services.AddScoped<ITimelineDbAccess, TimelineMongoDbAccess>();
            services.AddScoped<IProjectDbAccess, ProjectMongoDbAccess>();

            services.AddScoped<IKortistoFolderDbAccess, KortistoFolderMongoDbAccess>();
            services.AddScoped<IKortistoNpcTemplateDbAccess, KortistoNpcTemplateMongoDbAccess>();
            services.AddScoped<IKortistoNpcDbAccess, KortistoNpcMongoDbAccess>();
            services.AddScoped<IKortistoNpcTagDbAccess, KortistoNpcTagMongoDbAccess>();
            services.AddScoped<IKortistoNpcImplementationSnapshotDbAccess, KortistoNpcImplementationSnapshotMongoDbAccess>();

            services.AddScoped<IStyrFolderDbAccess, StyrFolderMongoDbAccess>();
            services.AddScoped<IStyrItemTemplateDbAccess, StyrItemTemplateMongoDbAccess>();
            services.AddScoped<IStyrItemDbAccess, StyrItemMongoDbAccess>();
            services.AddScoped<IStyrItemTagDbAccess, StyrItemTagMongoDbAccess>(); 
            services.AddScoped<IStyrItemImplementationSnapshotDbAccess, StyrItemImplementationSnapshotMongoDbAccess>();

            services.AddScoped<IEvneFolderDbAccess, EvneFolderMongoDbAccess>();
            services.AddScoped<IEvneSkillTemplateDbAccess, EvneSkillTemplateMongoDbAccess>();
            services.AddScoped<IEvneSkillDbAccess, EvneSkillMongoDbAccess>();
            services.AddScoped<IEvneSkillTagDbAccess, EvneSkillTagMongoDbAccess>();
            services.AddScoped<IEvneSkillImplementationSnapshotDbAccess, EvneSkillImplementationSnapshotMongoDbAccess>();

            services.AddScoped<IKirjaPageDbAccess, KirjaPageMongoDbAccess>();
            services.AddScoped<IKirjaPageVersionDbAccess, KirjaPageVersionMongoDbAccess>();

            services.AddScoped<IKartaMapDbAccess, KartaMapMongoDbAccess>();
            services.AddScoped<IKartaMarkerImplementationSnapshotDbAccess, KartaMarkerImplementationSnapshotMongoDbAccess>();

            services.AddScoped<ITaleDbAccess, TaleMongoDbAccess>();
            services.AddScoped<ITaleConfigDbAccess, TaleConfigMongoDbAccess>();
            services.AddScoped<ITaleDialogImplementationSnapshotDbAccess, TaleDialogImplementationSnapshotMongoDbAccess>();

            services.AddScoped<IAikaChapterOverviewDbAccess, AikaChapterOverviewMongoDbAccess>();
            services.AddScoped<IAikaChapterDetailDbAccess, AikaChapterDetailMongoDbAccess>();
            services.AddScoped<IAikaQuestDbAccess, AikaQuestMongoDbAccess>();
            services.AddScoped<IAikaQuestImplementationSnapshotDbAccess, AikaQuestImplementationSnapshotMongoDbAccess>();

            services.AddScoped<IExportTemplateDbAccess, ExportTemplateMongoDbAccess>();
            services.AddScoped<IExportDefaultTemplateProvider, ExportDefaultTemplateProvider>();
            services.AddScoped<ICachedExportDefaultTemplateProvider, CachedExportDefaultTemplateProvider>();
            services.AddScoped<IExportSettingsDbAccess, ExportSettingsMongoDbAccess>();
            services.AddScoped<IDialogFunctionGenerationConditionDbAccess, DialogFunctionGenerationConditionMongoDbAccess>();
            services.AddScoped<IDialogFunctionGenerationConditionProvider, DialogFunctionGenerationConditionProvider>();
            services.AddScoped<IExportFunctionIdDbAccess, ExportFunctionIdMongoDbAccess>();

            services.AddScoped<ILanguageKeyDbAccess, LanguageKeyMongoDbAccess>();

            services.AddScoped<ITaskBoardDbAccess, TaskBoardMongoDbAccess>();
            services.AddScoped<ITaskTypeDbAccess, TaskTypeMongoDbAccess>();
            services.AddScoped<ITaskGroupTypeDbAccess, TaskGroupTypeMongoDbAccess>();
            services.AddScoped<ITaskBoardCategoryDbAccess, TaskBoardCategoryMongoDbAccess>();
            services.AddScoped<ITaskNumberDbAccess, TaskNumberMongoDbAccess>();
            services.AddScoped<IUserTaskBoardHistoryDbAccess, UserTaskBoardHistoryMongoDbAccess>();

            services.AddScoped<IDbSetup, MongoDbSetup>();

            // Localization
            CultureInfo defaultCulture = new CultureInfo("en");
            List<CultureInfo> supportedCultures = new List<CultureInfo>
            {
                new CultureInfo("de"),
                new CultureInfo("en")
            };
            services.AddJsonLocalization(options => {
                options.FallbackCulture = defaultCulture;
                options.ResourcesPath = "Resources";
            });

            services.Configure<RequestLocalizationOptions>(options =>
            {
                options.DefaultRequestCulture = new RequestCulture(defaultCulture, defaultCulture);
                options.SupportedCultures = supportedCultures;
                options.SupportedUICultures = supportedCultures;
            });

            services.AddMvc().AddViewLocalization().AddDataAnnotationsLocalization().SetCompatibilityVersion(CompatibilityVersion.Version_2_2);;

            // Configuration
            services.Configure<ConfigurationData>(Configuration);

            // Register the Swagger generator
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new Info 
                    { 
                        Title = "GoNorth API", 
                        Version = "v1",
                        Description = "A portal to build storys for RPGs and other open world games.",
                        Contact = new Contact
                        {
                            Name = "Steffen Nörtershäuser"
                        },
                        License = new License
                        {
                            Name = "Use under MIT",
                            Url = "https://github.com/steffendx/GoNorth/blob/master/LICENSE"
                        }
                    });

                string baseDirectory = AppDomain.CurrentDomain.BaseDirectory;
                string commentsFileName = Assembly.GetExecutingAssembly().GetName().Name + ".XML";
                string commentsFile = Path.Combine(baseDirectory, commentsFileName);
                c.IncludeXmlComments(commentsFile);
            });
        }

        /// <summary>
        /// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        /// </summary>
        /// <param name="app">Application builder</param>
        /// <param name="env">Hosting environment</param>
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            ConfigurationData configData = Configuration.Get<ConfigurationData>();
            
            if (env.IsDevelopment())
            {
                EnvironmentSettings.IsDevelopment = true;
                app.UseDeveloperExceptionPage();
                app.UseDatabaseErrorPage();
            }
            else
            {
                EnvironmentSettings.IsDevelopment = false;
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseForwardedHeaders(new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
            });

            app.UseRequestLocalization();

            app.UseStaticFiles();

            if(configData.Misc.UseGdpr)
            {
                app.UseCookiePolicy();
            }

            app.UseAuthentication();

            if(env.IsDevelopment())
            {
                app.UseSwagger();

                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "GoNorth Api");
                });
            }

            app.UseMvc(routes =>
            {
                routes.MapRoute(name: "default", template: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}
