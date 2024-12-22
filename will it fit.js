const shipList = arr
// getShipDetails() //need to modify to get correct url- ?&{type}&id=&{uid.split(':')[1]}
const cargo = { weight: 0, volume: 0, ships: {} }

let isLoaded = true //default false. probably state. if done at all.
const loading = document.getElementById('loading')
if (isLoaded) {
    const main = document.querySelector('#main')

    loading.parentNode.removeChild(loading)

    const selectorDiv = ce('div')
    selectorDiv.id = 'selectorDiv'
    const select = ce('select')
    select.oninput = updateSelected //update selected entity stats
    shipList.map((element) => { //populate dropdown
        const option = ce('option')
        option.innerText = element.shipName
        select.appendChild(option)
    })
    selectorDiv.appendChild(select)
    const span = ce('span')
    span.innerText = ' * '
    selectorDiv.appendChild(span)
    const quantity = ce('input')
    quantity.type = 'number'
    quantity.name = 'quantity'
    quantity.id = 'quantity-input'
    quantity.value = 1
    quantity.oninput = updateSelected
    selectorDiv.appendChild(quantity)
    const button = ce('button')
    button.innerText = 'Add'
    button.onclick = addCargo
    selectorDiv.appendChild(button)
    main.appendChild(selectorDiv) //add dropdown, *, quantity, button to dom

    const statDiv = ce('div')
    statDiv.id = 'statDiv'
    const stats = ['weight', 'volume', 'quantity', 'total-weight', 'total-volume']
    stats.map((element) => {
        const p = ce('p')
        p.innerText = `${element}: `
        const span = ce('span')
        span.id = element
        if (element.split('-').length === 1) { //initial fill
            if (element === 'quantity') { span.innerText = document.querySelector('#quantity-input').value } else {
                span.innerText = shipList.find((ship) => { return ship.shipName === document.querySelector('select').value })[element].toLocaleString()
            }
        } else {
            span.innerText = shipList.find((ship) => { return ship.shipName === document.querySelector('select').value })[element.split('-')[1]].toLocaleString()
            p.innerText = element.replace('-', ' ') + ': '
        }
        p.innerText = p.innerText.replace(p.innerText[0], p.innerText[0].toUpperCase())
        p.appendChild(span)
        statDiv.appendChild(p)
    })
    main.appendChild(statDiv) //add stats for selected ships

    const cargoDiv = ce('div')
    cargoDiv.id = 'cargoDiv'
    const h2 = ce('h2')
    h2.innerText = 'Cargo'
    cargoDiv.appendChild(h2)
    const cargoDivHeaders = ['Name', 'Quantity', 'Weight', 'Volume']
    cargoDivHeaders.map((element) => {
        const h3 = ce('h3')
        h3.innerText = element
        cargoDiv.appendChild(h3)
    })
    main.appendChild(cargoDiv)
}

































function updateSelected() {
    const weight = shipList.find((ship) => { return ship.shipName === document.querySelector('select').value }).weight
    const volume = shipList.find((ship) => { return ship.shipName === document.querySelector('select').value }).volume
    const quantity = +document.querySelector('#quantity-input').value
    document.querySelector('#weight').innerText = weight.toLocaleString()
    document.querySelector('#volume').innerText = volume.toLocaleString()
    document.querySelector('#quantity').innerText = quantity.toLocaleString()
    document.querySelector('#total-weight').innerText = (weight * quantity).toLocaleString()
    document.querySelector('#total-volume').innerText = (volume * quantity).toLocaleString()
}

function addCargo() {
    const ship = shipList.find((ship) => { return ship.shipName === document.querySelector('select').value })
    let quantity = +document.querySelector('#quantity-input').value
    if (cargo.ships[ship.shipName]) { quantity += cargo.ships[ship.shipName].quantity }
    cargo.weight += ship.weight
    cargo.volume += ship.volume
    cargo.ships[ship.shipName] = { quantity: quantity, stats: ship }
    //add handling to add to cargoDiv
}


//got too tired of typing the whole thing out
function ce(arg) { return document.createElement(arg) }

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

                if (i + 1 === shipList.length()) { isLoaded = true }
                console.log("counter:", i, "details:", shipList)
            })

    });

}