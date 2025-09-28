import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to UniFuse!</Text>
      <Text style={styles.subtitle}>
        Trade your talents. Learn new skills. Connect with your community.
      </Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/swipe')}
      >
        <Text style={styles.buttonText}>Start Swapping</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={{ ...styles.button, backgroundColor: '#162F66', marginTop: 15 }}
        onPress={() => router.push('/profile')}
      >
        <Text style={styles.buttonText}>View My Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ ...styles.button, backgroundColor: '#162f66ff', marginTop: 15 }}
        onPress={() => router.push('/chat')}
      >
        <Text style={styles.buttonText}>Open Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7ca1cfff', 
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fbf9f6ff',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#162f66ff', 
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#571414ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});