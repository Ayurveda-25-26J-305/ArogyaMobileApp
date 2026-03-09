import { Picker } from "@react-native-picker/picker";
import React from "react";
import { Text, TextInput, View } from "react-native";

type FieldProps = {
  label: string;
  children?: React.ReactNode;
};

export const Field = ({ label, children }: FieldProps) => (
  <View className="mb-4">
    <Text className="text-gray-800 mb-1 font-semibold">{label}</Text>
    {children}
  </View>
);

// Picker component for dropdowns
type PickerFieldProps = {
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
};

export const PickerField = ({ selectedValue, onValueChange, items }: PickerFieldProps) => (
  <View className="bg-white border border-green-300 rounded-xl h-[56px] justify-center px-3">
    <Picker
      key={selectedValue}
      style={{ height: 56, backgroundColor: "white" }}
      dropdownIconColor="#1b5e20"
      selectedValue={selectedValue}
      onValueChange={onValueChange}
    >
      {items.map((item) => (
        <Picker.Item
          key={item.value}
          label={item.label}
          value={item.value}
        />
      ))}
    </Picker>
  </View>
);

// Text input for numeric or text fields
type InputFieldProps = {
  placeholder?: string;
  keyboardType?: "numeric" | "default";
  onChangeText: (text: string) => void;
};

export const InputField = ({ placeholder, keyboardType, onChangeText }: InputFieldProps) => (
  <TextInput
    keyboardType={keyboardType || "default"}
    placeholder={placeholder}
    className="bg-white border border-green-300 rounded-xl px-4 h-[56px]"
    onChangeText={onChangeText}
  />
);