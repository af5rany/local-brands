import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColor";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";

const FIXED_HEADERS = ["Size", "Length", "Width"];

export interface SizeRow {
  label: string;
  values: Record<string, string>;
}

export interface SizeChartData {
  title: string;
  unit: "in" | "cm";
  headers: string[];
  rows: SizeRow[];
  imageUrl?: string;
}

interface Props {
  value: SizeChartData | null;
  onChange: (data: SizeChartData | null) => void;
}

const empty = (): SizeChartData => ({
  title: "Size Guide",
  unit: "in",
  headers: FIXED_HEADERS,
  rows: [{ label: "S", values: { Size: "S", Length: "", Width: "" } }],
});

const SizeChartEditor: React.FC<Props> = ({ value, onChange }) => {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const { pickAndUpload } = useCloudinaryUpload();

  const data = value ?? null;

  const enable = () => onChange(empty());
  const disable = () => onChange(null);

  const set = (patch: Partial<SizeChartData>) =>
    data && onChange({ ...data, ...patch });

  const updateCell = (rowIdx: number, col: string, val: string) => {
    if (!data) return;
    const rows = data.rows.map((r, i) =>
      i === rowIdx ? { ...r, values: { ...r.values, [col]: val } } : r,
    );
    onChange({ ...data, rows });
  };

  const updateLabel = (rowIdx: number, val: string) => {
    if (!data) return;
    const rows = data.rows.map((r, i) =>
      i === rowIdx ? { ...r, label: val, values: { ...r.values, Size: val } } : r,
    );
    onChange({ ...data, rows });
  };

  const addRow = () => {
    if (!data) return;
    onChange({
      ...data,
      rows: [...data.rows, { label: "", values: { Size: "", Length: "", Width: "" } }],
    });
  };

  const removeRow = (idx: number) => {
    if (!data) return;
    onChange({ ...data, rows: data.rows.filter((_, i) => i !== idx) });
  };

  const pickImage = async () => {
    if (!data) return;
    setUploadingImg(true);
    try {
      const urls = await pickAndUpload();
      if (urls && urls[0]) set({ imageUrl: urls[0] });
    } finally {
      setUploadingImg(false);
    }
  };

  const s = styles(colors);

  return (
    <View style={s.wrap}>
      <TouchableOpacity
        style={s.header}
        onPress={() => setExpanded((p) => !p)}
        activeOpacity={0.7}
      >
        <Text style={s.headerText}>SIZE CHART</Text>
        <View style={s.headerRight}>
          {data ? (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); disable(); }}
              hitSlop={8}
            >
              <Text style={[s.toggleText, { color: colors.textTertiary }]}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); enable(); setExpanded(true); }}
              hitSlop={8}
            >
              <Text style={[s.toggleText, { color: colors.text }]}>+ Add</Text>
            </TouchableOpacity>
          )}
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textTertiary}
          />
        </View>
      </TouchableOpacity>

      {expanded && data && (
        <View style={s.body}>
          {/* Unit toggle */}
          <View style={s.unitRow}>
            <Text style={s.label}>Unit</Text>
            <View style={s.unitToggle}>
              {(["in", "cm"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[s.unitBtn, data.unit === u && s.unitBtnActive]}
                  onPress={() => set({ unit: u })}
                >
                  <Text style={[s.unitBtnText, data.unit === u && s.unitBtnTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Table */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Column headers */}
              <View style={s.row}>
                {FIXED_HEADERS.map((h) => (
                  <View key={h} style={s.cell}>
                    <Text style={s.colHeader}>{h}</Text>
                  </View>
                ))}
                <View style={s.deleteCell} />
              </View>

              {/* Data rows */}
              {data.rows.map((row, i) => (
                <View key={i} style={s.row}>
                  <View style={s.cell}>
                    <TextInput
                      style={[s.cellInput, { color: colors.text, borderColor: colors.border }]}
                      value={row.label}
                      onChangeText={(v) => updateLabel(i, v)}
                      placeholder="S"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  {["Length", "Width"].map((col) => (
                    <View key={col} style={s.cell}>
                      <TextInput
                        style={[s.cellInput, { color: colors.text, borderColor: colors.border }]}
                        value={row.values[col] ?? ""}
                        onChangeText={(v) => updateCell(i, col, v)}
                        placeholder="—"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  ))}
                  <TouchableOpacity
                    style={s.deleteCell}
                    onPress={() => removeRow(i)}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={14} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={s.addRow} onPress={addRow}>
            <Ionicons name="add" size={14} color={colors.text} />
            <Text style={[s.addRowText, { color: colors.text }]}>Add row</Text>
          </TouchableOpacity>

          {/* Measurement image */}
          <Text style={[s.label, { marginTop: 12 }]}>Measurement diagram (optional)</Text>
          {data.imageUrl ? (
            <View style={s.imgPreview}>
              <Image source={{ uri: data.imageUrl }} style={s.img} resizeMode="contain" />
              <TouchableOpacity
                style={s.imgRemove}
                onPress={() => set({ imageUrl: undefined })}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[s.imgPicker, { borderColor: colors.border }]} onPress={pickImage}>
              {uploadingImg ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={20} color={colors.textTertiary} />
                  <Text style={[s.imgPickerText, { color: colors.textTertiary }]}>
                    Upload diagram
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    wrap: {
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    headerText: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1,
      color: colors.text,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    toggleText: {
      fontSize: 12,
      fontWeight: "600",
    },
    body: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: 14,
    },
    unitRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textTertiary,
    },
    unitToggle: {
      flexDirection: "row",
      borderWidth: 1,
      borderColor: colors.border,
    },
    unitBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    unitBtnActive: {
      backgroundColor: colors.text,
    },
    unitBtnText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textTertiary,
    },
    unitBtnTextActive: {
      color: colors.background,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    cell: {
      width: 80,
      marginRight: 6,
      marginBottom: 6,
    },
    deleteCell: {
      width: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    colHeader: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textTertiary,
      textAlign: "center",
      paddingVertical: 4,
    },
    cellInput: {
      borderWidth: 1,
      paddingHorizontal: 6,
      paddingVertical: 6,
      fontSize: 12,
      textAlign: "center",
    },
    addRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
      paddingVertical: 6,
    },
    addRowText: {
      fontSize: 12,
      fontWeight: "600",
    },
    imgPicker: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderStyle: "dashed",
      paddingVertical: 20,
      marginTop: 8,
    },
    imgPickerText: {
      fontSize: 12,
      fontWeight: "600",
    },
    imgPreview: {
      marginTop: 8,
      position: "relative",
    },
    img: {
      width: "100%",
      height: 160,
    },
    imgRemove: {
      position: "absolute",
      top: 6,
      right: 6,
    },
  });

export default SizeChartEditor;
