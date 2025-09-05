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
        name="ads"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="categories"
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
        name="fees"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="revenue"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="subscriptions"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="technical"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="virtual"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
