
async function getShipList() {
    const shipList = []
    let count, start, total
    try {
        const response = await fetch("https://www.swcombine.com/ws/v2.0/types/ships?start_index=1")
        console.log(response)
    } catch (error) {
        console.log(error)
    }
}

getShipList()