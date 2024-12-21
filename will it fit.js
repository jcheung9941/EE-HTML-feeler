const shipList = arr
// getShipDetails() //need to modify to get correct url- ?&{type}&id=&{uid.split(':')[1]}

let isLoaded = true
const loading = document.getElementById('loading')
if (isLoaded) {
    loading.parentNode.removeChild(loading)
    const selectorDiv = document.createElement('div')
    selectorDiv.id = 'addShip'
    const select = document.createElement('select')
    select.onchange = () => {
        document.querySelector('#weight').innerText = shipList.find((element)=>{return element.shipName === document.querySelector('select').value}).weight
        document.querySelector('#volume').innerText = shipList.find((element)=>{return element.shipName === document.querySelector('select').value}).volume
        document.querySelector('#quantity').innerText = document.querySelector('#quantity-input').value
    }
    shipList.map((element) => {
        const option = document.createElement('option')
        option.innerText = element.shipName
        select.appendChild(option)
    })
    selectorDiv.appendChild(select)
    const quantity = document.createElement('input')
    quantity.type = 'text'
    quantity.name = 'quantity'
    quantity.id = 'quantity-input'
    quantity.value = 1
    selectorDiv.appendChild(quantity)
    const button = document.createElement('button')
    button.innerText = 'Add'
    button.onclick = ()=>{
        console.log('hello world')
    }
    selectorDiv.appendChild(button)
    document.querySelector('#main').appendChild(selectorDiv)
    
    const statDiv = document.createElement('div')
    statDiv.id = 'selectedStats'
    const stats = ['weight', 'volume', 'quantity']
    stats.map((element)=>{
        const p = document.createElement('p')
        p.innerText = `${element}: `
        const span = document.createElement('span')
        span.id = element
        span.innerText = shipList.find((element)=>{return element.shipName === document.querySelector('select').value})[element]
        if(element === 'quantity') {span.innerText = document.querySelector('#quantity-input').value}
        p.appendChild(span)
        statDiv.appendChild(p)
    })
    document.querySelector('#main').appendChild(statDiv)
}









































function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function getShipUid() {
    let resAttributes = {
        count: 0,
        start: 1,
        total: 1000,
    }
    try {
        while (resAttributes.start - 1 < +resAttributes.total) {
            const response = await fetch(
                `https://corsproxy.io/?url=https://www.swcombine.com/ws/v2.0/types/ships?start_index=${resAttributes.start}`,
                { headers: { Accept: "application/json" }, }
            )
            const data = await response.json()

            resAttributes = { ...data.swcapi.shiptypes.attributes }
            loading.innerText = `Loading... identified ${start}/${total} ships`
            resAttributes.start = +resAttributes.start + +resAttributes.count
            data.swcapi.shiptypes.shiptype.forEach(element => {
                shipList.push({ uid: element.attributes.uid, href: element.attributes.href, shipName: element.value, })
            });
        }
    } catch (error) {
        console.log(error)
    }
}

async function getShipDetails() {
    await getShipUid()

    shipList.forEach(async (element, i) => {

        await sleep(1100 * i) //to bypass rate limits
            .then(async () => {

                loading.innerText = `Loading... ${i}/${shipList.length} ship details imported`
                const response = await fetch(
                    `https://corsproxy.io/?url=https://www.swcombine.com/ws/v2.0/types/ships/${element.uid}`,
                    { headers: { Accept: "application/json" }, }
                )
                let data = await response.json()
                data = data.swcapi.shiptype
                shipList[i] = {
                    ...element,
                    hyper: data.speed.hyperspace,
                    weight: data.weight.value,
                    volume: data.volume.value,
                    weightCapacity: data.weightcapacity.value,
                    volumeCapacity: data.volumecapacity.vaue,
                    passengers: data.maxpassengers,
                    party: data.slotsize,
                    isHangar: data.hangarbay === "yes" ? true : false,
                    isDocking: data.dockingbay === "yes" ? true : false,
                    images: data.images,
                }

                console.log("counter:", i, "details:", shipList)
            })

    });

}