const cheerio = require('cheerio');
const axios = require('axios');
const { MessageEmbed } = require('discord.js');

module.exports = async ({client, category}) => {
    client.log(`[schedule]: Creeping category ${category.id}`)

    const savedProducts = await client.db.getDistinctProducts({category: category.id})
    const activeSubscriptions = await client.db.getDistinctActiveSubscriptions({category: category.id})

    const req = await axios({
        method: 'get',
        url: category.creepUrls[0]
    })
        
    const doc = cheerio.load(req.data)
    
    const products = doc('#mpc_tulossa-olevat .col-6').toArray().map(elem => {
        try{
            const brand = cheerio.text(doc(".manufacturer-name", elem)).replace(/(?:\r\n|\r|\n)/g, '');
            const name = cheerio.text(doc(".product-title", elem)).replace(/(?:\r\n|\r|\n)/g, '');
            const href = doc("a", elem).attr('href');
            const img = doc("img", elem).attr('src');
            const availableEpoch = doc(".counter-upcoming", elem).attr(':until');
            const availableDate = new Date(parseInt(availableEpoch) * 1000);
            const available = `${availableDate.getDate()}.${availableDate.getMonth() + 1}.${availableDate.getFullYear()}`;
            return {
                name: `${brand} - ${name}`,
                id: `${brand} - ${name}`,
                available,
                href,
                img
            }
        }catch(ex){
            console.log(ex)
            log(`[DG-SCHEDULER]: Failed checking powergrip upcoming product ${ex.message}`, 3)
        }
    }).filter(p => (p.name && p.name !== ''));

    for(const product of products){
        const savedProduct = (savedProducts)? savedProducts.find(p => p.id === product.id) : null;
        if(savedProduct && savedProduct.active)
            return;
        
        if(savedProduct && !savedProduct.active){
            //Restock alert
            return;
        }

        await client.db.addProduct({
            category: category.id,
            name: product.name,
            id: product.id,
            available: product.available,
            href: product.href,
            img: product.img
        })

        const discordMessage = new MessageEmbed()
            .setTitle(`${product.name} tulossa powergrippiin ${product.available}`)
            .setDescription(`['${product.name}'](${product.href})`)
            .setImage(product.img)

        activeSubscriptions.forEach(async (subscription) => {
            const channel = await client.channels.fetch(subscription.channelId)
            const sent = await channel.send({ embeds: [discordMessage], ephemeral: false })
            await client.db.saveSentMessage({
                content: `${product.name} tulossa powergrippiin ${product.available}`,
                messageId: sent.id,
                initiator: `SUBSCRIPTION_${subscription._id}_${subscription.category}`
            })
        })
    }
}