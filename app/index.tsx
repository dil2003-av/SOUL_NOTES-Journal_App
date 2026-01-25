import { View, Text } from 'react-native'
import React from 'react'
import { Redirect } from 'expo-router'
import "../global.css"

const index = () => {
  return <Redirect href= {"/login"}/>
}

export default index