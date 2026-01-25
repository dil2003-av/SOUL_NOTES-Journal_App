import { View, Text } from 'react-native'
import React from 'react'
import { Slot } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { LoaderProvider } from '@/context/LoaderContext'

const RootLayout = () => {
  const insets = useSafeAreaInsets()
  console.log(insets)
  return (
    <LoaderProvider>
      <View className='flex-1' style={{ marginTop: insets.top }}>
      <Slot />
      </View>
    </LoaderProvider>

      
    // <SafeAreaView className='flex-1'>
    //    <Slot />
    //    </SafeAreaView>
    
     
  )
}

export default RootLayout