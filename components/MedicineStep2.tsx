import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Field, PickerField, InputField } from "../app/(tabs)/FormFields";
import { AGNI_OPTIONS } from "../utils/constants";

interface MedicineStep2Props {
  form: any;
  update: (key: string, value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function MedicineStep2({ form, update, onBack, onNext }: MedicineStep2Props) {
  return (
    <View className="bg-white rounded-3xl p-6 shadow-md border border-green-100 space-y-5">
      <Text className="text-lg font-semibold text-[#1b5e20] mb-3">
        Physiological Balance
      </Text>

      <Field label="Agni State">
        <PickerField
          selectedValue={form.agni}
          onValueChange={(v) => update("agni", v)}
          items={AGNI_OPTIONS}
        />
      </Field>

      {["vata", "pitta", "kapha"].map((key) => (
        <Field
          key={key}
          label={`${key.charAt(0).toUpperCase() + key.slice(1)} Score (0-10)`}
        >
          <InputField
            keyboardType="numeric"
            placeholder="Enter value"
            onChangeText={(v) => update(key, v)}
          />
        </Field>
      ))}

      <View className="flex-row justify-between pt-2">
        <TouchableOpacity
          onPress={onBack}
          className="bg-green-400 py-4 px-6 rounded-xl flex-1 mr-2"
        >
          <Text className="text-white font-semibold text-center">Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          className="bg-[#1b5e20] py-4 px-6 rounded-xl flex-1 ml-2"
        >
          <Text className="text-white font-semibold text-center">Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}