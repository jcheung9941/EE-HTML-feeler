const shipList = arr
// const shipList =[]
// getShipDetails() //disable =arr if this is active
const cargo = { weight: 0, volume: 0, ships: {} }

let isLoaded = true //default false. probably state. if done at all.
const loading = document.getElementById('loading')
if (isLoaded) {
    loading.parentNode.removeChild(loading)
    while (document.querySelector('.hidden')) {
        document.querySelector('.hidden').classList.remove('hidden')
    }

    const select = document.createElement('select')
    select.oninput = updateSelected //update selected entity stats
    shipList.forEach((element) => { //populate dropdown
        const option = document.createElement('option')
        option.innerText = element.shipName
        select.appendChild(option)
    })
    document.querySelector('#selectorDiv').insertBefore(select, document.querySelector('span'))

    let quantity = document.querySelector('#quantity').innerText
    document.querySelector('#weight').innerText = findShip().weight.toLocaleString()
    document.querySelector('#volume').innerText = findShip().volume.toLocaleString()
    document.querySelector('#total-weight').innerText = (findShip().weight * quantity).toLocaleString()
    document.querySelector('#total-volume').innerText = (findShip().volume * quantity).toLocaleString()
}

function findShip() {
    return shipList.find((ship) => { return ship.shipName === document.querySelector('select').value })
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
    // todo:
    // add ability to combine like entities
    // add ability to remove entities
    // check if can figure out how to see performance cost of redrawing entire list vs replacing nodes
    while (document.querySelector(`#cargoDiv p`)) {
        document.querySelector(`#cargoDiv p`).parentNode.removeChild(document.querySelector(`#cargoDiv p`))
    }
    const ship = shipList.find((ship) => { return ship.shipName === document.querySelector('select').value })
    let quantity = +document.querySelector('#quantity-input').value
    const cargoDivHeaders = ['shipName', 'quantity', 'weight', 'volume']
    cargoDivHeaders.forEach((element) => {
        const p = document.createElement('p')
        if (element != 'quantity') {
            p.innerText = ship[element].toLocaleString()
        } else {
            p.innerText = quantity.toLocaleString()
        }
        cargoDiv.appendChild(p)
    })
    cargo.weight += ship.weight * quantity
    cargo.volume += ship.volume * quantity
    if (cargo.ships[ship.shipName]) { quantity += cargo.ships[ship.shipName].quantity }
    cargo.ships[ship.shipName] = { quantity: quantity, stats: ship }
    document.querySelector('#cargoDiv h2').innerText = `Cargo (${cargo.weight.toLocaleString()}T / ${cargo.volume.toLocaleString()}m³ )`

    let single = shipList.filter((ship) => {
        if (ship.weightCapacity >= cargo.weight && ship.volumeCapacity >= cargo.volume && ship.isDocking) { return true } else { return false }
    })
    console.log(single) //
    addNewLine(single, 'single')


}

function addNewLine(ships, id) {
    while (document.querySelector(`#${id} p`)) { // todo: see if there's a better way to do this
        document.querySelector(`#${id} p`).parentNode.removeChild(document.querySelector(`#${id} p`))
    }
    const divHeaders = ['shipName', 'hyper', 'qty', 'party']
    ships.forEach((ship) => {
        divHeaders.forEach((element) => {
            const p = document.createElement('p')
            if (element != 'qty') {
                p.innerText = ship[element].toLocaleString()
            } else {
                p.innerText = Math.floor(Math.ceil(cargo.weight / ship.weightCapacity, cargo.volume / ship.volumeCapacity))
            }
            document.querySelector(`#${id}`).appendChild(p)
        })
    })
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
            loading.innerText = `Loading... identified ${resAttributes.start}/${resAttributes.total} ships`
            resAttributes.start = +resAttributes.start + +resAttributes.count
            data.swcapi.shiptypes.shiptype.forEach(element => {
                shipList.push({ uid: element.attributes.uid, shipName: element.value, })
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
                    href: `https://www.swcombine.com/rules/?${data.class.attributes.value}&ID=${element.uid.split(':')[1]}`,
                    hyper: data.speed.hyperspace,
                    weight: data.weight.value,
                    volume: data.volume.value,
                    weightCapacity: data.weightcapacity.value,
                    volumeCapacity: data.volumecapacity.value,
                    passengers: data.maxpassengers,
                    party: data.slotsize,
                    isHangar: data.hangarbay === "yes" ? true : false,
                    isDocking: data.dockingbay === "yes" ? true : false,
                    images: data.images,
                }

                if (i + 1 === shipList.length) { isLoaded = true } //eh. doesn't actually work, probably need to convert if(isLoaded) to a function
                console.log("counter:", i, "details:", shipList)
            })

    });

}