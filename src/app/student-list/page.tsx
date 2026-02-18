'use client';

import Image from 'next/image';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { students, Student } from '@/lib/student-data';
import { Eye, FilePen, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function StudentListPage() {
  const classes = ['6', '7', '8', '9', '10'];
  const classNamesMap: { [key: string]: string } = {
    '6': '৬ষ্ঠ',
    '7': '৭ম',
    '8': '৮ম',
    '9': '৯ম',
    '10': '১০ম',
  };

  const getStudentsByClass = (className: string): Student[] => {
    return students.filter((student) => student.className === className);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>শিক্ষার্থীদের তালিকা</CardTitle>
              <Link href="/add-student">
                <Button>নতুন শিক্ষার্থী যোগ করুন</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="6">
              <TabsList className="grid w-full grid-cols-5">
                {classes.map((className) => (
                  <TabsTrigger key={className} value={className}>
                    {classNamesMap[className]} শ্রেণি
                  </TabsTrigger>
                ))}
              </TabsList>
              {classes.map((className) => (
                <TabsContent key={className} value={className}>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ছবি</TableHead>
                            <TableHead>রোল</TableHead>
                            <TableHead>শিক্ষার্থীর নাম</TableHead>
                            <TableHead>পিতার নাম</TableHead>
                            <TableHead>মোবাইল নম্বর</TableHead>
                            <TableHead className="text-right">কার্যক্রম</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getStudentsByClass(className).map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>
                                <Image
                                  src={student.photoUrl}
                                  alt={student.studentNameBn}
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                              </TableCell>
                              <TableCell>{student.roll.toLocaleString('bn-BD')}</TableCell>
                              <TableCell>{student.studentNameBn}</TableCell>
                              <TableCell>{student.fatherNameBn}</TableCell>
                              <TableCell>{student.mobile}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="icon">
                                    <FilePen className="h-4 w-4" />
                                  </Button>
                                  <Button variant="destructive" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
