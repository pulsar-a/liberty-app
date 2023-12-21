import Versions from './components/Versions'
import icons from './assets/icons.svg'
import { Flex, Text, Button } from '@radix-ui/themes'

function App(): JSX.Element {
  return (
    <div className="container">
      <Versions></Versions>

      <svg className="hero-logo" viewBox="0 0 900 300">
        <use xlinkHref={`${icons}#electron`} />
      </svg>

      <Flex direction="column" gap="2">
        <Text className="text-3xl font-bold underline">Hello from Radix Themes :)</Text>
        <Button>Let's go</Button>
      </Flex>
    </div>
  )
}

export default App
