import { Stack } from 'expo-router';

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
        name="analytics"
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
        name="reports"
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
        name="users"
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
