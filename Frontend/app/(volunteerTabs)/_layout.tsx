import { Stack } from 'expo-router';
import React from 'react';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="home"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="explore"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="virtualhub"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="emergency"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="calendar"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="crowdfunding"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
