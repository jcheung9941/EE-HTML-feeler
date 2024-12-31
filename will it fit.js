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

    const dataList = document.createElement('datalist')
    dataList.id = 'shipOptions'
    shipList.forEach((element) => { //populate dropdown
        const option = document.createElement('option')
        option.innerText = element.shipName
        dataList.appendChild(option)
    })
    document.querySelector('#selectorDiv').insertBefore(dataList, document.querySelector('span'))
}

function findShip() {
    return shipList.find((ship) => { return ship.shipName === document.querySelector('#ship-input').value })
}

function updateSelected() {
    const weight = shipList.find((ship) => { return ship.shipName === document.querySelector('#ship-input').value }).weight
    const volume = shipList.find((ship) => { return ship.shipName === document.querySelector('#ship-input').value }).volume
    const quantity = +document.querySelector('#quantity-input').value
    document.querySelector('#weight').innerText = weight.toLocaleString()
    document.querySelector('#volume').innerText = volume.toLocaleString()
    document.querySelector('#quantity').innerText = quantity.toLocaleString()
    document.querySelector('#total-weight').innerText = (weight * quantity).toLocaleString()
    document.querySelector('#total-volume').innerText = (volume * quantity).toLocaleString()
}

function addCargo() {
    const ship = shipList.find((ship) => { return ship.shipName === document.querySelector('#ship-input').value })
    let quantity = +document.querySelector('#quantity-input').value
    cargo.weight += ship.weight * quantity
    cargo.volume += ship.volume * quantity
    if (cargo.ships[ship.shipName]) { quantity += cargo.ships[ship.shipName].quantity }
    cargo.ships[ship.shipName] = { quantity: quantity, stats: ship }
    updateCargo()
}

function edit() {
    const ship = cargo.ships[this.parentNode.previousSibling.innerText]
    cargo.weight += ship.stats.weight * (+this.value - ship.quantity)
    cargo.volume += ship.stats.volume * (+this.value - ship.quantity)
    ship.quantity = +this.value
    updateCargo()
}

function updateCargo() {
    // todo: check if can figure out how to see performance cost of redrawing entire list vs replacing nodes
    while (document.querySelector(`#cargoDiv p`)) {
        document.querySelector(`#cargoDiv p`).parentNode.removeChild(document.querySelector(`#cargoDiv p`))
    }
    const cargoDivHeaders = ['shipName', 'quantity', 'weight', 'volume']
    Object.keys(cargo.ships).forEach((key) => {
        const cargoShip = cargo.ships[key]
        cargoDivHeaders.forEach((element) => {
            const p = document.createElement('p')
            if (element != 'shipName' && element != 'quantity') {
                p.innerText = `${(cargoShip.quantity * cargoShip.stats[element]).toLocaleString()} (${cargoShip.stats[element].toLocaleString()})`
            } else if (element === 'quantity') {
                const editQuantity = document.createElement('input')
                editQuantity.type = 'number'
                editQuantity.value = cargoShip.quantity
                editQuantity.onchange = edit
                p.appendChild(editQuantity)
            } else {
                p.innerText = key
            }
            cargoDiv.appendChild(p)
        })
    })
    document.querySelector('#cargoDiv h2').innerText = `Cargo (${cargo.weight.toLocaleString()}T / ${cargo.volume.toLocaleString()}m³ )`

    const single = shipList.filter((ship) => {
        if (ship.isDocking && ship.weightCapacity >= cargo.weight && ship.volumeCapacity >= cargo.volume) { return true } else { return false }
    })
    updateCarried('single', single)

    const squad = shipList.filter((ship) => {
        if (ship.isDocking && ship.weightCapacity * Math.floor(12 / ship.party) >= cargo.weight && ship.volumeCapacity * Math.floor(12 / ship.party) >= cargo.volume) { return true } else { return false }
    })
    updateCarried('squad', squad)
}

function updateCarried(id, ships = []) {
    while (document.querySelector(`#${id} p`)) { // todo: see if there's a better way to do this
        document.querySelector(`#${id} p`).parentNode.removeChild(document.querySelector(`#${id} p`))
    }
    if (ships.length === 0) {
        const p = document.createElement('p')
        p.innerText = 'no match found'
        document.querySelector(`#${id}`).appendChild(p)
        return
    }
    const divHeaders = ['shipName', 'hyper', 'qty', 'party']
    ships.forEach((ship) => {
        divHeaders.forEach((element) => {
            const p = document.createElement('p')
            if (element != 'qty' && element != 'party') {
                p.innerText = ship[element].toLocaleString()
            } else {
                let qty = Math.floor(Math.ceil(cargo.weight / ship.weightCapacity, cargo.volume / ship.volumeCapacity))
                p.innerText = element === 'qty' ? qty : ship[element] * qty
            }
            document.querySelector(`#${id}`).appendChild(p)
        })
    })
}

function resetType() {
    document.querySelector('#ship-input').value = ''
    document.querySelector('#quantity-input').value = 1
}

function resetAll() {
    resetType()
    cargo.weight = 0
    cargo.volume = 0
    cargo.ships = {}
    while (document.querySelector(`#cargoDiv p`)) {
        document.querySelector(`#cargoDiv p`).parentNode.removeChild(document.querySelector(`#cargoDiv p`))
    }
    updateCarried('single')
    updateCarried('squad')
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
                { headers: { Accept: 'application/json' }, }
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
                    { headers: { Accept: 'application/json' }, }
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
                    isHangar: data.hangarbay === 'yes' ? true : false,
                    isDocking: data.dockingbay === 'yes' ? true : false,
                    images: data.images,
                }

                if (i + 1 === shipList.length) { isLoaded = true } //eh. doesn't actually work, probably need to convert if(isLoaded) to a function
                console.log('counter:', i, 'details:', shipList)
            })

    });

}