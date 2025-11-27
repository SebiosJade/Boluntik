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
        name="calendar"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="crowdfundingorg"
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
        name="certificates"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="volunteers"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="resources"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="impacttracker"
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
    </Stack>
  );
}
