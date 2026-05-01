import React, {useState, useEffect} from "react";

function App(){

  const [data, setData] = useState([{}])

  useEffect(() => {
    fetch("/stocks").then
    (
      res => res.json()
    ).then
    (
      data =>{
        setData(data)
        console.log(data)
      }
    )
  }, [])

  return (
    <div>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : 'Loading...'}
    </div>
  )

}
export default App