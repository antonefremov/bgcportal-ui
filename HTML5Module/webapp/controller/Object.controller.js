// @ts-nocheck
sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/ui/thirdparty/jquery",
    "../model/formatter"
], function (BaseController, JSONModel, History, jquery, formatter) {
    "use strict";

    return BaseController.extend("ns.HTML5Module.controller.Object", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
        onInit: function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                busy: true,
                delay: 0
            });
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "objectView");
            this.oController = this;
            // this._pdfViewer = new sap.m.PDFViewer();;
            // this.getView().addDependent(this._pdfViewer);
        },
        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */
        onAfterRendering: function () {
            var oSplitCont = this.getView().byId("SplitContDemo"),
                ref = oSplitCont.getDomRef() && oSplitCont.getDomRef().parentNode;
            // set all parent elements to 100% height, this should be done by app developer, but just in case
            if (ref && !ref._sapUI5HeightFixed) {
                ref._sapUI5HeightFixed = true;
                while (ref && ref !== document.documentElement) {
                    var $ref = jquery(ref);
                    if ($ref.attr("data-sap-ui-root-content")) { // Shell as parent does this already
                        break;
                    }
                    if (!ref.style.height) {
                        ref.style.height = "100%";
                    }
                    ref = ref.parentNode;
                }
            }
        },

		/**
		 * Event handler  for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
        onNavBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
        _onObjectMatched: function (oEvent) {
           
            this.objectId = oEvent.getParameter("arguments").objectId;
            var processId =  oEvent.getParameter("arguments").processId; 
            this._bindView("/Request",this.objectId);
            
            //destroying content of table everytime we enter for new candidate to get fresh data
            this.getView().byId("idEmployementHistoryTable").destroyItems();
            this.getView().byId("idDrugUseTestTable").destroyItems();
            //this._bindEmploymentHistoryTable(this.screeningTaskId);
            
            //call processType service to get the assigned screening task for the process ID of selected candidate 
            this.getScreeningTasksList(processId);
        },
        
        getScreeningTasksList :  function(processId){
            var oThis=this;
             this.getView().setBusy(true);
             var aScreeningTaskIds= [];
                jQuery.ajax({
                                 type: 'GET',
                                 contentType: 'application/json',
                                 url: "/nsHTML5Module/bgcportal/api/v1/ProcessType?$filter=processTypeID eq '" + processId + "'",
                                 success: function (data) {
                                   for(var i=0 ; i<data.value.length ; i++){
                                     aScreeningTaskIds.push(data.value[i].screeningTaskType_ID);
                                   }
                                   oThis._bindMasterList(aScreeningTaskIds);
                                    oThis.getView().setBusy(false);
                                 },
                                 error: function (e) {
                                     console.log("error: " + JSON.stringify(e));
                                     oThis.getView().setBusy(false);
                                 }
                     });
        },

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
        _bindView: function (sObjectPath,ID) {
            var oViewModel = this.getModel("objectView");

            this.getView().bindElement({
                path: sObjectPath + ID,
                parameters: {
                                // $filter: "ID eq " + ID,
                                // $$updateGroupId: 'EmploymentHistoryUpdateGroup',
                                $expand:'category,status,assignedToAgent,candidate'
                                
                           },
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        oViewModel.setProperty("/busy", true);
                    },
                    dataReceived: function () {
                        oViewModel.setProperty("/busy", false);
                    }
                }
            });
        },

	    /**
		 * Binds the master panel list to the screening tasks.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
        _bindMasterList: function (aScreeningTaskIds) {
            var oThis= this;
             oThis.list = this.getView().byId("masterPageListID");

                //changing StandardListItem item to CustomListItem to include microchart
               var oItemTemplate = new sap.m.CustomListItem({
                    type: sap.m.ListType.Active,
                    press:oThis._navToDetailPage.bind(oThis),
                    content: [
                       new sap.m.FlexBox({
                           alignItems:"Start",
                           justifyContent:"SpaceBetween",
                           items:[
                                    new sap.m.HBox({
                                   //JustifyItems: sap.m.FlexAlignContent.Start,
                                   items:[
                                          new sap.m.VBox({
                                         items:[
                                                new sap.ui.core.Icon({
                                                    size: "2rem",
                                                    src: "sap-icon://attachment-photo",
                                                })
                                            ]
                                          }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTopBottom"),
                                            new sap.m.VBox({
                                                items: [
                                                    new sap.m.Title({
                                                        text: "{screeningTaskTypeDescription}"
                                                    }),
                                                    new sap.m.Label({
                                                        text: "{screeningTaskTypeName}"
                                                    })]
                                            }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTopBottom"),
                                            
                                        ] 
                                    }),
                                      // code to add radial chart to show completion
                                    new sap.m.HBox({
                                      width:"20%",
                                      items:[
                                            new sap.suite.ui.microchart.RadialMicroChart({
                                                    width:"0rem",
                                                    size:"S",
                                                    percentage:"{completion}"
                                                    })
                                                ]
                                        }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTopBottom"),                                   
                                ]
                        })
                     ] 
                 });

            // create a CustomData template, set its key to "answer" and bind its value to the answer data
            var oDataTemplate = new sap.ui.core.CustomData({ key: "screeningId", value: "{ID}" });

            // add the CustomData template to the item template
            oItemTemplate.addCustomData(oDataTemplate);
            var orFilter = [];
            for(var i =0 ; i<aScreeningTaskIds.length;i++){
                orFilter.push(new sap.ui.model.Filter("screeningTaskTypeID", sap.ui.model.FilterOperator.EQ, aScreeningTaskIds[i]));
                }
            oThis.list.bindItems({
                path: "/MyScreeningTask",
                filters: orFilter,
                template: oItemTemplate,
                 templateShareable: true,
                 parameters: {
                     $filter: "candidateID eq " + this.objectId
                }
                // parameters: {
                    //$filter: "screeningTaskTypeID eq " + aScreeningTaskIds[0] + " and screeningTaskTypeID eq" +  aScreeningTaskIds[1]
                   // $filter: "EMAIL eq " + "'" + loggedUser.id + "' and ARCHIVE eq false",
                    //$filter: new sap.ui.model.Filter(orFilter, false)
                     //$filter: new sap.ui.model.Filter("screeningTaskTypeID", sap.ui.model.FilterOperator.EQ, aScreeningTaskIds[0])
                //}
            })

            oThis.list.getBinding("items").attachDataReceived(function (){
                if(oThis.list.getItems().length>0){
                  oThis.list.getItems()[0].firePress();
                }
            });
        },

        _navToDetailPage: function (oEvent) {
            var splitApp = this.getView().byId("SplitContDemo");
            var screeningTaskId = oEvent.getSource().getBindingContext().getProperty("ID");
            var sListItemtitle = oEvent.getSource().getBindingContext().getProperty("screeningTaskTypeDescription");
             switch (sListItemtitle) {
                case "Employment History":
                    splitApp.toDetail(this.createId("EmploymentHistorydetailPage"));
                    this.getView().byId("EmploymentHistorydetailPage").setVisible(true);
                    this._bindEmploymentHistoryTable(screeningTaskId);
                    break;
                case "Drug Use Test":
                    splitApp.toDetail(this.createId("DrugUseTestDetailPage"));
                    this.getView().byId("DrugUseTestDetailPage").setVisible(true);
                    this._bindDrugUseTestTable(screeningTaskId);
                    break;
            }
        },

        _bindEmploymentHistoryTable: function (screeningTaskId) {
            var oThis = this;
            var oTable = this.getView().byId("idEmployementHistoryTable");
            // var oModel =oThis.getModel("objectView");
            // var oDataPath="/EmploymentHistory";

            //--------------------------------------------------------
            // oTable.setModel(oModel);
            // oTable.bindColumns(oDataPath, function(index, context) {
            // var sColumnId = context.getObject().columnid;
            // return new sap.ui.table.Column({
            // id : sColumnId,
            // label: sColumnId,
            // template: sColumnId,
            // sortProperty: sColumnId,
            // filterProperty: sColumnId,
            // });
            // });

            // oTable.bindRows(oDataPath);

            //-----------------------------------------------------

            //   oModel.read(oDataPath,null,null,null,function(){

            //     metadata = oModel.getServiceMetadata();
            //     entityRef = metadata.dataServices.schema[0].entityType[oDataIndex];
            //     listOfProperties = entityRef.property;

            //     oTable.addColumn(new sap.ui.table.Column({
            //         label: new sap.ui.commons.Label({text:"Edit/Delete"}),
            //         template: oButtonLayout,
            //         width: "120px"
                
            //         }));

            //     for ( var i = 0; i < listOfProperties.length; i++) {
            //     oTable.addColumn(new sap.ui.table.Column({
            //     label: new sap.ui.commons.Label({text : listOfProperties[i].name}),
            //     template: new sap.ui.commons.TextField().bindProperty("value", listOfProperties[i].name)
            //     }))  
            //     }



            //     oTable.setModel(oModel); // set model to Table
            //     oTable.bindRows(oDataPath); // oDataPath is the alias of the table in the oData Service


            //     });

            //----------------------------------------------------

            // oModel.attachMetadataLoaded(oModel, function () {
            //    //fnLoadMetadata();
            // oTable.setModel(oModel);
            // oTable.setEntitySet("EmploymentHistory");
            // var oMeta = oModel.getServiceMetadata();
            // var headerFields = "";
            // for (var i = 0; i < oMeta.dataServices.schema[0].entityType[0].property.length; i++) {
            //     var property = oMeta.dataServices.schema[0].entityType[0].property[i];
            //     headerFields += property.name + ",";
            // }
            // oTable.setInitiallyVisibleFields(headerFields);
            //     });

//------------------------------------------------------------
            //  for (var i = 0; i < 4; i++) {
            //                 var oColumn = new sap.m.Column("col" + i, {
            //                     width: "1em",
            //                     header: new sap.m.Label({
            //                     text: {}
            //                     })
            //                 });
            //             oTable.addColumn(oColumn);
            //             }
            //             var oCell = [];
            //             for (var i = 0; i < 4; i++) {
            //                             if (i === 0) {
            //                             var cell1 = new sap.m.Text({
            //                                             text: "{QuestionTx}"
            //                                             });
            //                             }
            //             oCell.push(cell1);
            //             }
            //              var aColList = new sap.m.ColumnListItem("aColList", {
            //                 cells: oCell
            //             });

            // oTable.bindItems({
            //     path: oDataPath,
            //     template :aColList,
            //     parameters: {
            //             $filter: "screeningTask_ID eq " + screeningTaskId,
            //            // $$updateGroupId: 'EmploymentHistoryUpdateGroup',
            //            // $expand:'status,conduct'
            //         },
            //     events: {
            //        // change: this._onBindingChange.bind(this),
            //         dataRequested: function () {
                         
            //         },
            //         dataReceived: function (oEvent) {
            //                var a = oEvent
                        
                        
            //         }
            //     }
            //     });

            //----------------------------------------------------------------

            oTable.bindItems({
                //binding with EmploymentHistory entity for property update since view does not support update
                path: "/EmploymentHistory",
                template: new sap.m.ColumnListItem({
                    cells: [
                        new sap.m.ObjectIdentifier({ title: "{employer}" }),
                        new sap.m.Text({ text: "{designation}" }),
                        new sap.m.Text({ text: "{ctc}" }),
                        new sap.m.Text({ text: "{email}" }),
                        new sap.m.Text({ text: "{phone}" }),
                        new sap.m.Button({ text: "1", icon: "sap-icon://show", press: oThis._showDocument }),
                        new sap.m.Text({ text: "{status/description}" }),
                        new sap.m.Button({ icon: "sap-icon://accept", press: oThis._openAprroveRejectDialog.bind(oThis) }) 
                    ]
                }),
                templateShareable: true,
                 parameters: {
                     $filter: "screeningTask_ID eq " + screeningTaskId,
                     $$updateGroupId: 'EmploymentHistoryUpdateGroup',
                     $expand:'status,conduct'
                 },
                  
            });
        },

        //load fragment with dialog for approve and reject employment History
        _openAprroveRejectDialog: function(oEvent){
            var oThis = this;
           // oThis.getView().setBusy(true);
          
                if (!oThis._oDialog) {
                    oThis._oDialog = sap.ui.xmlfragment("ns.HTML5Module.Fragments.ApproveRejectDialog", this);
                }  
                 oThis._oDialog.setBusy(true);         
                oThis._oDialog.setModel(oEvent.getSource().getBindingContext().getModel());
               oThis._oDialog.bindElement({
                path: oEvent.getSource().getBindingContext().getPath(),
                parameters: {
                    // $filter: "screeningTask_ID eq " + screeningTaskId,
                     $$updateGroupId: 'EmploymentHistoryUpdateGroup',
                     //$expand:'status,conduct'
                 },
                events: {
                   // change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                         
                    },
                    dataReceived: function () {
                         oThis._oDialog.setBusy(false);
                        //oThis.getView().setBusy(false);
                        
                    }
                }
                
            });
               oThis._oDialog.open();
                
        },

        //batch call trigerred with all the changes on press of save 
        onSavePress: function(oEvent){
           
            var oThis=this;
            var oBindingContextDialog= oEvent.getSource().getBindingContext();
            oThis.currentModel = oBindingContextDialog.getModel();
             oThis.currentModel.submitBatch("EmploymentHistoryUpdateGroup").then(function(evt){
                    // raise success message
                    oThis.currentModel.refresh();
                   // oThis.currentModel.updateBinding(true);
            });
            oThis._oDialog.close();
                        
        },

        onCancelPress: function(oEvent){
            var currentModel= oEvent.getSource().getBindingContext().getModel();;
             currentModel.resetChanges("EmploymentHistoryUpdateGroup");
             this._oDialog.close();
        },

        _bindDrugUseTestTable: function (screeningTaskId) {
            var oTable = this.getView().byId("idDrugUseTestTable");
            oTable.bindItems({
                path: "/DrugUseType",
                template: new sap.m.ColumnListItem({
                    cells: [
                        new sap.m.ObjectIdentifier({ title: "{drugTypeDescription}" }),
                        new sap.m.Text({ text: "{testRequirement}" }),
                        new sap.m.Text({ text: "{permissibleLimit}" }),
                        new sap.m.Text({ text: "{testDate}" }),
                        new sap.m.Text({ text: "{testResult}" }),
                        new sap.m.Text({ text: "{amountDetected}" }),
                        new sap.m.Text({ text: "{comment}" })
                    ]
                }),
                templateShareable: true,
                parameters: {
                    $filter: "screeningTaskID eq " + screeningTaskId
                }
            });
        },

        _showDocument: function (oEvent) {
            var opdfViewer = new sap.m.PDFViewer();
            //this.getView().addDependent(opdfViewer);
            var sServiceURL = oEvent.getSource().getModel().sServiceUrl;
            // var screeningTaskId = oEvent.getSource().getBindingContext().getProperty("screeningTask_ID");

            //in the below commented line, url is hardcoded and it does download something directy I guess the pdf type
            //format is problem. But when I try filtering document by screeningtask id, without adding "/content" it gives me 2 objects 
            //but can't see anything like "content". after adding "/content" it gives 400 error.
            // need to check how to pass the id and then content so that it makes url like hardcoded line here

            var sSource = sServiceURL + "Documents(AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA)/content";
            // var sSource = sServiceURL + "Documents?$filter=screeningTask_ID eq "+ screeningTaskId +"/content";

            opdfViewer.setSource(sSource);
            opdfViewer.setTitle("PDF file");
            opdfViewer.open();
        },

        openApproveBGCDialog: function(oEvent){
         var oThis = this;
                if (!oThis._oApproveBGCDialog){
                    oThis._oApproveBGCDialog = sap.ui.xmlfragment("ns.HTML5Module.Fragments.ApproveBGCDialog", this);
                      //setting the binding context and model in dialog for binding
                        var oBindingContext = oEvent.getSource().getBindingContext();
                         oThis._oApproveBGCDialog.setBindingContext(oBindingContext);
                         oThis._oApproveBGCDialog.setModel(oEvent.getSource().getBindingContext().getModel());
                        
                }
               
               oThis._oApproveBGCDialog.open();
        },
         onCancelBGCPress: function(oEvent){
            //var currentModel= oEvent.getSource().getBindingContext().getModel();;
             //currentModel.resetChanges("EmploymentHistoryUpdateGroup");
             this._oApproveBGCDialog.close();
        },
        onApproveBGCPress: function(oEvent){
            oEvent.getSource().getBindingContext().setProperty("status/description","Completed");
             this._oApproveBGCDialog.close();
        },
        onRejectBGC: function(oEvent){
            oEvent.getSource().getBindingContext().setProperty("status/description","Rejected");
        },
        _onBindingChange: function () {
            var oView = this.getView(),
                oViewModel = this.getModel("objectView"),
                oElementBinding = oView.getElementBinding();

            // No data for the binding
            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("objectNotFound");
                return;
            }

            var oResourceBundle = this.getResourceBundle();

            oView.getBindingContext().requestObject().then((function (oObject) {
                var sObjectId = oObject.ID,
                    sObjectName = oObject.candidate_ID;


                oViewModel.setProperty("/busy", false);
                oViewModel.setProperty("/shareSendEmailSubject",
                    oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
                oViewModel.setProperty("/shareSendEmailMessage",
                    oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
            }).bind(this));
        }

    });

});