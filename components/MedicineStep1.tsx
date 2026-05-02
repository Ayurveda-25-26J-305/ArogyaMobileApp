import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Field, PickerField, InputField } from "../app/(tabs)/FormFields";
import { DISEASE_OPTIONS, REGION_OPTIONS, GENDER_OPTIONS } from "../utils/constants";

interface MedicineStep1Props {
  form: any;
  update: (key: string, value: string) => void;
  onNext: () => void;
}

export default function MedicineStep1({ form, update, onNext }: MedicineStep1Props) {
  return (
    <View className="bg-white rounded-3xl p-6 shadow-md border border-green-100 space-y-5">
      <Field label="Health Condition">
        <Text className="text-gray-500 text-xs mb-2">
          Select the main condition you are experiencing
        </Text>
        <PickerField
          selectedValue={form.disease}
          onValueChange={(v) => update("disease", v)}
          items={DISEASE_OPTIONS}
        />
      </Field>

      <Field label="Living Region">
        <Text className="text-gray-500 text-xs mb-2">
          Climate and environment affect Ayurvedic treatment
        </Text>
        <PickerField
          selectedValue={form.region}
          onValueChange={(v) => update("region", v)}
          items={REGION_OPTIONS}
        />
      </Field>

      <Field label="Gender">
        <PickerField
          selectedValue={form.gender}
          onValueChange={(v) => update("gender", v)}
          items={GENDER_OPTIONS}
        />
      </Field>

      <Field label="Age">
        <InputField
          keyboardType="numeric"
          placeholder="Enter your age"
          onChangeText={(v) => update("age", v)}
        />
      </Field>

      <TouchableOpacity
        onPress={onNext}
        className="bg-[#1b5e20] py-4 rounded-xl items-center mt-4 shadow"
      >
        <Text className="text-white font-semibold text-base">Continue</Text>
      </TouchableOpacity>
    </View>
  );
}