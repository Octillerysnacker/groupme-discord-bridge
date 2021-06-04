import { ChannelIdentifier } from './channel/ChannelIdentifier';
import { ChannelLinker } from './bridge/ChannelLinker';
import config from './config';
import { DiscordChannel } from './channel/DiscordChannel';
import { DiscordClient } from './client/DiscordClient';
import { GroupMeChannel } from './channel/GroupMeChannel';
import { GroupMeClient } from './client/GroupMeClient';
import { ErrorHandler } from './util/ErrorHandler';
import * as http from 'http';
let linker : ChannelLinker;

let errorHandler : ErrorHandler = console.error;

(async ()=>{

    // initialize the clients
    let groupMeClient = new GroupMeClient(parseInt(process.env.PORT) || config.listenPort, config.groupme.callbackURL, errorHandler);
    let discordClient = await DiscordClient.connect(config.discord.token, errorHandler);

    linker = new ChannelLinker(discordClient, groupMeClient);


    // for each bridge ...
    await Promise.all(config.bridges.map(async server=>{
        let discordChannelId : ChannelIdentifier<DiscordChannel> = {
            guildId: server.discord.guildId,
            channelId: server.discord.channelId
        };

        let groupMeChannelId : ChannelIdentifier<GroupMeChannel> = {
            botId: server.groupme.botId,
            channelId: server.groupme.groupId
        };

        // ... link the two channels on the bridge
        await linker.link(discordChannelId, groupMeChannelId);
    }));



})().catch(errorHandler);
