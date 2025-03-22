import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const PatientRecords: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: records, isLoading, error } = useQuery({
    queryKey: ['all-patient-records'],
    queryFn: async () => {
      const { data: emergencyCases, error: emergencyError } = await supabase.from('emergency_cases').select('*');
      const { data: medicalRecords, error: medicalError } = await supabase.from('medical_records').select('*');

      if (emergencyError) throw new Error(`Error fetching emergency cases: ${emergencyError.message}`);
      if (medicalError) throw new Error(`Error fetching medical records: ${medicalError.message}`);

      return [...(emergencyCases || []), ...(medicalRecords || [])];
    },
  });

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    return records.filter((record) =>
      record.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.case_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.record_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  const genderData = useMemo(() => {
    if (!records) return [];
    const genderCounts = records.reduce((acc, record) => {
      const gender = record.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(genderCounts).map(([name, value]) => ({ name, value }));
  }, [records]);

  const ageGroupData = useMemo(() => {
    if (!records) return [];
    const ageGroups = records.reduce((acc, record) => {
      const age = record.age || 0;
      const group = age < 20 ? '0-19' : age < 40 ? '20-39' : age < 60 ? '40-59' : '60+';
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
  }, [records]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Patient Records</h2>
        <input
          type="text"
          placeholder="Search records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded-md"
        />
      </div>

      {isLoading && <p>Loading records...</p>}
      {error && <p className="text-red-500">Error loading records</p>}

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Cases by Gender</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={genderData}
              cx={200}
              cy={150}
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {genderData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Cases by Age Group</h3>
          <BarChart width={400} height={300} data={ageGroupData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Case Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{record.patientName || 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.symptoms || record.record_type}</td>
                  <td className="px-6 py-4">
  {Array.isArray(record.details)
    ? record.details.map((detail, index) => (
        <div key={index}>{detail.description}</div>
      ))
    : record.details?.severity || record.severity}
</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(record.date || record.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
  {Array.isArray(record.details)
    ? record.details.map((detail, index) => (
        <div key={index}>{detail.description}</div>
      ))
    : record.details?.description || record.description}
</td>                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No matching records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
