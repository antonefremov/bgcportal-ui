// @ts-nocheck
sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/ui/thirdparty/jquery",
    "../model/formatter"
], function (BaseController, JSONModel, History, jquery, formatter) {
    "use strict";

    return BaseController.extend("ns.HTML5Module.controller.LoginPage", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
        onInit: function () {
            
        },
        OnSignInButtonPress: function(){     
            var user = this.getView().byId("userInputId").getValue();   
            var password = this.getView().byId("passwordInputId").getValue(); 
            //checking with one dummy user needed to show in customer demo
            if(user === "Dummy" && password === "Welcome"){
               this.getRouter().navTo("worklist");
            }else{
                new sap.m.MessageBox.error("Sign In Failed, please try again!");
            }  
           
        }

    });

});