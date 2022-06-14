
const executeJob = async ( client ) => {
    for(const category of client.config.discCategories){
        try {
            const storeHandler = await require(`./jobs/${category.storeType}`)
            if(storeHandler)
                storeHandler({client, category});
        }catch(ex){
            client.error(`Could not handle store creeping for category ${category.id}`)
        }
    }
}

module.exports = (schedule, client) => {
    client.log("[SCHEDULE-MDS]: Registering schedule job")

    //0th second of every minute.
    schedule.scheduleJob("0 */1 * * * *", async () => {
        try{
            client.log("[SCHEDULE-MDS]: Checking discgolf stores")
            executeJob(client);
        }catch(ex){
            console.log(ex);
            client.error(`[SCHEDULE-MDS]: ${ex.code} '${ex.message}'`);
        }
    });
}