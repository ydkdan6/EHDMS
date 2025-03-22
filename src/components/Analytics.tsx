import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Analytics: React.FC = () => {
  const { data: emergencyCases } = useQuery({
    queryKey: ['analytics-emergency-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_cases')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: hospitals } = useQuery({
    queryKey: ['analytics-hospitals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  const severityData = React.useMemo(() => {
    if (!emergencyCases) return [];
    
    const counts = emergencyCases.reduce((acc: any, curr) => {
      acc[curr.severity] = (acc[curr.severity] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [emergencyCases]);

  const dailyCaseData = React.useMemo(() => {
    if (!emergencyCases) return [];

    const dailyCounts = emergencyCases.reduce((acc: any, curr) => {
      const date = format(new Date(curr.created_at), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  }, [emergencyCases]);

  const hospitalCapacityData = React.useMemo(() => {
    if (!hospitals) return [];

    return hospitals.map(hospital => ({
      name: hospital.name,
      available: hospital.capacity.available,
      total: hospital.capacity.total,
    }));
  }, [hospitals]);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Emergency Cases by Severity</h3>
        <PieChart width={400} height={300}>
          <Pie
            data={severityData}
            cx={200}
            cy={150}
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {severityData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Daily Emergency Cases</h3>
        <LineChart width={600} height={300} data={dailyCaseData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="count" stroke="#8884d8" />
        </LineChart>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Hospital Capacity</h3>
        <BarChart width={600} height={300} data={hospitalCapacityData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="available" fill="#82ca9d" name="Available Beds" />
          <Bar dataKey="total" fill="#8884d8" name="Total Beds" />
        </BarChart>
      </div>
    </div>
  );
};