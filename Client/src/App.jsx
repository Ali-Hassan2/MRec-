import { useState } from "react"
import axios, { AxiosError } from "axios"
const App = () => {
  const [originalLink, setOriginalLink] = useState("")
  const [wrapperLink, setWrapperLink] = useState("")
  const [generating, setGenerating] = useState(false)
  const handleGettingWrapperLink = async (e) => {
    e.preventDefault()
    setGenerating(true)
    try {
      const response = await axios.post("http://localhost:4003/generatelink", {
        original_link: originalLink,
      })
      const resultant_link = response.data?.wrapperLink || ""
      setWrapperLink(resultant_link)
    } catch (error) {
      console.log("There is an error", error)
      if (axios.isAxiosError(error)) {
        const error_Data = error.response?.data?.message
        const error_for_console = error_Data || "Something failed in the way"
        console.log(error_for_console)
      } else if (error instanceof Error) {
        console.log(error?.message)
      } else {
        console.log("Unexcpected Error.")
      }
    } finally {
      setGenerating(false)
    }
  }
  const handleCopy = () => {
    if (!wrapperLink) return
    navigator.clipboard.writeText(wrapperLink)
    alert("Link Copied")
  }
  return (
    <>
      <div>
        <form onSubmit={handleGettingWrapperLink}>
          <input
            type="text"
            placeholder="Enter original Meet Link...."
            onChange={(e) => {
              setOriginalLink(e.target.value)
            }}
          />
          <button type="submit" disabled={generating}>
            {generating ? "generating your link..." : "Generate"}
          </button>
        </form>
        {wrapperLink.length > 0 && (
          <div>
            <p>Your Wrapper Link is Here: {wrapperLink}</p>
            <button onClick={handleCopy}>Copy</button>
          </div>
        )}
      </div>
    </>
  )
}

export default App
