const cheerio = require('cheerio');
const axios = require('axios');
const { MessageEmbed } = require('discord.js');

module.exports = async ({client, category}) => {
    client.log(`[schedule]: Creeping category ${category.id}`)

    const savedProducts = await client.db.getDistinctProducts({category: category.id})
    const activeSubscriptions = await client.db.getDistinctActiveSubscriptions({category: category.id})

    category.creepUrls.forEach(async (url) => {
        const req = await axios({
            method: 'get',
            url
        })

        if(req.data.includes("Kolahti alarautaan"))
            return
            
        const doc = cheerio.load(req.data)
        
        const products = await doc('.Product').toArray().map(elem => {
            try{
                const name = doc("h2", elem).text();
                const id = doc(elem).attr('data-product-id');
                const available = doc(elem).hasClass('Available');
                const href = "https://www.innovastore.fi" + doc("a", elem).attr('href');
                const img = "https://www.innovastore.fi" + doc("img", elem).attr('src');
                return {
                    name,
                    id,
                    available,
                    href,
                    img
                }
            }catch(ex){
                console.log(ex)
                log(`[DG-SCHEDULER]: Failed checking innova product ${ex.message}`, 3)
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
                .setTitle(`${product.name} havaittu innovastoressa`)
                .setDescription(`['${product.name}'](${product.href})`)
                .setImage(product.img)

            activeSubscriptions.forEach(async (subscription) => {
                const channel = await client.channels.fetch(subscription.channelId)
                const sent = await channel.send({ embeds: [discordMessage], ephemeral: false })
                await client.db.saveSentMessage({
                    content: `${product.name} havaittu innovastoressa`,
                    messageId: sent.id,
                    initiator: `SUBSCRIPTION_${subscription._id}_${subscription.category}`
                })
            })
        }   
    })
}