const MongoClient = require('mongodb').MongoClient;
const { v4 } = require('uuid');

class DBHandler {
    constructor (options) {
        if(!options)
            throw(new Error("[DBHandler]: No options present"))
        if(!options.url)
            throw(new Error("[DBHandler]: No MongoURL present (Missing 'url')"))
        if(!options.db)
            throw(new Error("[DBHandler]: No default database present (Missing 'db')"))

        this.client = MongoClient.connect(options.url, { useNewUrlParser: true, useUnifiedTopology: true });
        this.cache = options.cache || null;
        this.options = options;
    }

    async toggleSubscriptionToCategory({channel, category, user}) {
        const activeSubscription = await this.findOne({col: "subscriptions", filter: {channelId: channel.id, category, active: true}});
        if(!activeSubscription){
            await this.insert({ col: "subscriptions", doc: {
                category,
                channelId: channel.id,
                channel,
                createdOn: Date.now(),
                createdBy: user,
                active: true,
                _id: v4(),
                _ts: Date.now(),
            }})
            return true;
        }
        await this.update({ col: "subscriptions", filter: {channelId: channel.id, category, active: true}, doc: {
            active: false,
            deactivatedOn: Date.now(),
            deactivatedBy: user,
            _ts: Date.now(),
        }})
        return false;
    }

    async getChannelSubscriptions({channelId}) {
        return await this.find({ col: "subscriptions", filter: {active: true, channelId} })
    }

    async getActiveSubscriptions() {
        return await this.find({ col: "subscriptions", filter: {active: true} })
    }

    async getDistinctActiveSubscriptions({category}){
        return await this.find({ col: "subscriptions", filter: {category, active: true} })
    }

    async getProducts({filter = {}}){
        return await this.find({ col: "products", filter })
    }

    async getDistinctProducts({category, filter = {}}){
        return await this.find({ col: "products", filter: {category, ...filter} })
    }

    async addProduct({category, id, name, href, img, available = true}){
        await this.insert({ col: "products", doc: {
            category,
            id,
            name,
            href,
            img,
            available,
            createdOn: Date.now(),
            active: true,
            _id: v4(),
            _ts: Date.now(),
        }})
        return true;
    }

    async saveSentMessage({content, messageId, initiator}){
        await this.insert({ col: "messages", doc: {
            content,
            messageId,
            initiator,
            sentOn: Date.now(),
            _id: v4(),
            _ts: Date.now(),
        }})
        return true;
    }

    connected() {
        return (this.client && this.client.topology && this.client.topology.isConnected())
    }

    async get({col, db, id}){
        if(!this.connected())
            this.client = await MongoClient.connect(this.options.url, { useNewUrlParser: true, useUnifiedTopology: true });
        
        return await this.client.db(db || this.options.db).collection(col).findOne({ _id: id })
    }

    async findOne({col, db, filter}){
        if(!this.connected())
            this.client = await MongoClient.connect(this.options.url, { useNewUrlParser: true, useUnifiedTopology: true });
        
        return await this.client.db(db || this.options.db).collection(col).findOne(filter)
    }

    async find({col, db, filter}){
        if(!this.connected())
            this.client = await MongoClient.connect(this.options.url, { useNewUrlParser: true, useUnifiedTopology: true });
        
        return await this.client.db(db || this.options.db).collection(col).find(filter).toArray();
    }

    async update({col, db, filter, doc}){
        if(!this.connected())
            this.client = await MongoClient.connect(this.options.url, { useNewUrlParser: true, useUnifiedTopology: true });
        
        return await this.client.db(db || this.options.db).collection(col).findOneAndUpdate(filter, { $set: doc }, {returnNewDocument: true})
    }

    async insert({col, db, doc}){
        if(!this.connected())
            this.client = await MongoClient.connect(this.options.url, { useNewUrlParser: true, useUnifiedTopology: true });
        
        return await this.client.db(db || this.options.db).collection(col).insertOne(doc)
    }

    async insertMany({col, db, docs}){
        if(!this.connected())
            this.client = await MongoClient.connect(this.options.url, { useNewUrlParser: true, useUnifiedTopology: true });
        
        return await this.client.db(db || this.options.db).collection(col).insertMany(docs)
    }

}


module.exports = (options) => new DBHandler(options);