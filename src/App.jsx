import { useState } from "react"
import { supabase } from "./lib/supabase"

export default function App() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const testInsert = async () => {
    const { error } = await supabase
      .from("users_data")
      .insert([
        {
          name,
          email,
          message
        }
      ])

    if (error) {
      console.log(error)
      alert("Insert failed")
    } else {
      alert("Saved to Supabase!")
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Axiom Supabase Test</h2>

      <input
        placeholder="Name"
        onChange={(e) => setName(e.target.value)}
      />
      <br />

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />

      <input
        placeholder="Message"
        onChange={(e) => setMessage(e.target.value)}
      />
      <br />

      <button onClick={testInsert}>
        Send to Supabase
      </button>
    </div>
  )
}
