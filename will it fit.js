const shipList = arr
// getShipDetails() //need to modify to get correct url- ?&{type}&id=&{uid.split(':')[1]}
const cargo = { weight: 0, volume: 0, ships: {} }

let isLoaded = true //default false. probably state. if done at all.
const loading = document.getElementById('loading')
if (isLoaded) {
    loading.parentNode.removeChild(loading)
    while(document.querySelector('.hidden')) {
        document.querySelector('.hidden').classList.remove('hidden')
    }

    const select = document.createElement('select')
    select.oninput = updateSelected //update selected entity stats
    shipList.map((element) => { //populate dropdown
        const option = document.createElement('option')
        option.innerText = element.shipName
        select.appendChild(option)
    })
    document.querySelector('#selectorDiv').insertBefore(select, document.querySelector('span'))
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
    const cargoDivHeaders = ['shipName', 'quantity', 'weight', 'volume']
    let quantity = +document.querySelector('#quantity-input').value
    cargoDivHeaders.map((element) => {
        const p = ce('p')
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

                if (i + 1 === shipList.length()) { isLoaded = true }
                console.log("counter:", i, "details:", shipList)
            })

    });

}