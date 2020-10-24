const express = require("express");
const bodyParser = require("body-parser");
import { Express, RequestHandler } from 'express';
import { AttachmentData, attachmentIsImage } from '../channel/Attachment';
import { GenericClient } from './GenericClient';
import { GroupMeChannel } from "../channel/GroupMeChannel";
import { MessagePayload } from '../channel/MessagePayload';
import {Request as Request_} from 'express-serve-static-core';
import { ErrorHandler } from "../util/ErrorHandler";

/** This corresponds to a GroupMe account.*/
export class GroupMeClient extends GenericClient<GroupMeChannel>{

    /** This is the server to listen for new groupme messages on */
    private expressApp: Express;


    /** @param port the port to listen for messages on
     * @param callbackURL the local URL that GroupMe will send messages to */
    constructor(port: Number, callbackURL: string, errorHandler:ErrorHandler) {
        super();
        
        // create the listening server
        this.expressApp = express();
        this.expressApp.use(bodyParser.json());
        this.expressApp.listen(port, () => console.log("Listening for GroupMe messages on port " + port));

        // await each new message from the GroupMe server
        this.expressApp.post(callbackURL, (req, res) => {
            this.handleIncomingMessage(req).catch(errorHandler);
        });
    }

    /** called any time anybody sends a message on any groupme group our bots are in */
    private async handleIncomingMessage(req: Request_){

        // the id of the channel (group) that the message was sent on
        let channelId = req.body.group_id;

        // we don't want bot messages! (otherwise there'd be an infinite loop :o)
        if (req.body.sender_type == "bot" || req.body.system)
            return;

        // make sure that the channel exists in our system
        if(!this.has(channelId))
            return;
        
        let message: MessagePayload = {
            sender: req.body.name,
            messageText: req.body.text,
            attachments: !req.body.attachments ? [] : req.body.attachments.filter(attachmentIsImage).map(x=>new AttachmentData(x))
        };

        await this.messageReceived(channelId, message);
    }

    // return a groupme channel based on a channel identifier
    protected async resolveChannel(id: { botId: string; channelId: string; }): Promise<GroupMeChannel> {
        return new GroupMeChannel(id.botId);
    }
}
