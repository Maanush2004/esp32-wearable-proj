import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "#f2f2f2",
    },
    modalFlatlistContiner: {
      flex: 1,
      justifyContent: "center",
    },
    modalCellOutline: {
      borderWidth: 1,
      borderColor: "black",
      alignItems: "center",
      marginHorizontal: 20,
      paddingVertical: 15,
      borderRadius: 8,
    },
    modalTitle: {
      flex: 1,
      backgroundColor: "#f2f2f2",
    },
    modalTitleText: {
      marginTop: 40,
      fontSize: 30,
      fontWeight: "bold",
      marginHorizontal: 20,
      textAlign: "center",
    },
    ctaButton: {
      backgroundColor: "dodgerblue",
      justifyContent: "center",
      alignItems: "center",
      height: 50,
      marginHorizontal: 20,
      marginBottom: 5,
      borderRadius: 8,
      padding: 10
    },
    ctaButtonText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "white",
    },
  });