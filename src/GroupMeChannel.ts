import { promises } from "fs";
import { AttachmentGroupMePayload } from "./AttachmentType";
import { GenericChannel, MessagePayload } from "./MessagePayload";

const request = require("request-promise");

export class GroupMeChannel extends GenericChannel {
    private botId: string;

    constructor(botId: string) {
        super();
        this.botId = botId;
    }

    async sendMessage(message: MessagePayload) {
        let gmAttachments : AttachmentGroupMePayload[];


        await Promise.all(message.attachments.map(async attachmentData=>{
            let gmAttachment = await attachmentData.uploadToGroupMe();
            gmAttachments.push(gmAttachment);
        }));

        let messageText = "";
        if(message.messageText.length == 0){
            messageText = `<${message.sender}> ${message.messageText}`;
        }else{
            messageText = `<${message.sender} sent an image>`;
        }
    
        let options = {
            method: 'POST',
            uri: 'https://api.groupme.com/v3/bots/post',
            body: {
                bot_id: this.botId,
                text: messageText,
                attachments: gmAttachments.length==0 ? undefined : gmAttachments
            },
            json: true
        };

        return request(options);
    }
}